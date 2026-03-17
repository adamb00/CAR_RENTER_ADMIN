'use server';
import BookingRequestEmailTemplate from '@/components/emails/booking-request-email';
import {
  BOOKING_EMAIL_FROM,
  LOGO_URL,
  CONTACT_STATUS_QUOTE_SENT,
} from '@/lib/constants';
import {
  BOOKING_FROM_ADDRESS,
  MAIL_USER,
  getTransporter,
  hasMailerConfig,
} from '@/lib/mailer';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { EMAIL_COPY } from '@/components/emails/utils/email-copy';
import {
  EmailCopy,
  SendBookingRequestEmailInput,
  SendBookingRequestEmailResolvedInput,
} from '@/components/emails/types';
import { normalizeConfirmationLocale } from '@/lib/format/format-locale';
import { buildTextBody } from '@/components/emails/utils/build-text-body';

type SendBookingRequestEmailResult = {
  success?: string;
  error?: string;
};

type BookingRequestOfferData = {
  adminName?: string | null;
  carId?: string | null;
  carName?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  rentalFee?: string | null;
  deposit?: string | null;
  insurance?: string | null;
  deliveryFee?: string | null;
  deliveryLocation?: string | null;
  extrasFee?: string | null;
  locale?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  bookingLink: string;
};

let cachedLogoDataUrl: string | null | undefined;

const getLogoDataUrl = async () => {
  if (LOGO_URL) return LOGO_URL;
  if (cachedLogoDataUrl !== undefined) return cachedLogoDataUrl;

  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');

  const logoPaths = ['logo_white.png', 'logo_black.png'].map((file) =>
    join(process.cwd(), 'public', file),
  );

  for (const logoPath of logoPaths) {
    try {
      const buffer = readFileSync(logoPath);
      cachedLogoDataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
      return cachedLogoDataUrl;
    } catch (error) {
      console.error(
        'sendBookingRequestEmailAction logo load failed',
        logoPath,
        error,
      );
    }
  }

  cachedLogoDataUrl = null;
  return cachedLogoDataUrl;
};

const buildHtmlBody = async (
  copy: EmailCopy,
  input: SendBookingRequestEmailResolvedInput,
): Promise<string> => {
  const logoSrc = await getLogoDataUrl();
  const { renderToStaticMarkup } = await import('react-dom/server');

  const html = renderToStaticMarkup(
    <BookingRequestEmailTemplate
      copy={copy}
      input={input}
      logoSrc={logoSrc ?? undefined}
    />,
  );

  return `<!doctype html>${html}`;
};

const buildBookingLink = (
  locale: string,
  carId: string,
  quoteId: string,
  offerIndex: number,
) => {
  const safeLocale = normalizeConfirmationLocale(locale);
  const encodedCarId = encodeURIComponent(carId);
  const encodedQuoteId = encodeURIComponent(quoteId);
  return `https://zodiacsrentacar.com/${safeLocale}/cars/${encodedCarId}/rent?quoteId=${encodedQuoteId}&offer=${offerIndex}`;
};

const toNullableString = (value?: string | null) =>
  value === undefined ? null : value;

const buildBookingRequestRecord = (
  input: SendBookingRequestEmailResolvedInput,
): BookingRequestOfferData[] =>
  input.offers.map((offer) => ({
    adminName: toNullableString(input.adminName),
    carId: toNullableString(offer.carId),
    carName: toNullableString(offer.carName),
    rentalStart: toNullableString(input.rentalStart),
    rentalEnd: toNullableString(input.rentalEnd),
    rentalFee: offer.rentalFee ?? null,
    deposit: offer.deposit ?? null,
    insurance: offer.insurance ?? null,
    deliveryFee: offer.deliveryFee ?? null,
    deliveryLocation: offer.deliveryLocation ?? null,
    extrasFee: offer.extrasFee ?? null,
    locale: toNullableString(input.locale),
    contactName: toNullableString(input.name),
    contactEmail: toNullableString(input.email),
    bookingLink: offer.bookingLink,
  }));

const markQuoteAsProcessed = async (
  quoteId: string,
  bookingRequestData: BookingRequestOfferData[],
  signerName?: string | null,
) => {
  await db.contactQuotes.update({
    where: { id: quoteId },
    data: {
      status: CONTACT_STATUS_QUOTE_SENT,
      updatedAt: new Date(),
      bookingRequestData,
    },
  });

  await db.$executeRaw`
    UPDATE "ContactQuotes"
    SET "signerName" = ${toNullableString(signerName)}
    WHERE "id" = ${quoteId}::uuid
  `;
};

export const sendBookingRequestEmailAction = async (
  input: SendBookingRequestEmailInput,
): Promise<SendBookingRequestEmailResult> => {
  const recipient = input.email?.trim();

  if (!recipient) {
    return { error: 'Ehhez az ajánlatkéréshez nincs e-mail cím megadva.' };
  }

  if (!Array.isArray(input.offers) || input.offers.length === 0) {
    return { error: 'Nincs ajánlat megadva ehhez az ajánlatkéréshez.' };
  }

  if (input.offers.some((offer) => !offer.carId)) {
    return { error: 'Az ajánlat(ok)ban nincs autó kiválasztva.' };
  }

  if (!hasMailerConfig() || !BOOKING_FROM_ADDRESS) {
    return {
      error:
        'Az e-mail küldéshez hiányzik a konfiguráció (MAIL_HOST/PORT/USER/PASS vagy BOOKING_EMAIL_FROM/EMAIL_FROM).',
    };
  }

  const locale = normalizeConfirmationLocale(input.locale);
  const copy = EMAIL_COPY[locale] ?? EMAIL_COPY.en;
  const offersWithLinks = input.offers.map((offer, index) => ({
    ...offer,
    bookingLink: buildBookingLink(
      locale,
      offer.carId as string,
      input.quoteId,
      index,
    ),
  }));

  const inputWithLinks: SendBookingRequestEmailResolvedInput = {
    ...input,
    offers: offersWithLinks,
  };

  const text = buildTextBody(copy, inputWithLinks);
  const html = await buildHtmlBody(copy, inputWithLinks);
  const bookingRequestData = buildBookingRequestRecord(inputWithLinks);

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: BOOKING_FROM_ADDRESS,
      to: recipient,
      subject: copy.subject,
      text,
      html,
      replyTo: MAIL_USER ?? BOOKING_EMAIL_FROM,
    });
  } catch (error) {
    console.error('sendBookingRequestEmailAction sendMail', error);
    return {
      error: 'Az e-mail küldése közben hiba történt. Próbáld meg később.',
    };
  }

  try {
    await markQuoteAsProcessed(
      input.quoteId,
      bookingRequestData,
      input.adminName,
    );
    revalidatePath('/quotes');
    revalidatePath(`/quotes/${input.quoteId}`);
  } catch (error) {
    console.error('sendBookingRequestEmailAction statusUpdate', error);
    return {
      error:
        'Az e-mail elküldve, de a státuszt nem sikerült frissíteni az adatbázisban.',
    };
  }

  return { success: copy.successMessage ?? 'Foglaláskérés e-mail elküldve.' };
};
