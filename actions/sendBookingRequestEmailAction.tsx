'use server';
import BookingRequestEmailTemplate, {
  buildTextBody,
  EmailCopy,
  normalizeLocale,
  SendBookingRequestEmailInput,
} from '@/components/emails/booking-request-email';
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

type SendBookingRequestEmailResult = {
  success?: string;
  error?: string;
};

type BookingRequestData = {
  adminName?: string | null;
  carId?: string | null;
  carName?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  rentalFee?: string | null;
  deposit?: string | null;
  insurance?: string | null;
  deliveryFee?: string | null;
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
    join(process.cwd(), 'public', file)
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
        error
      );
    }
  }

  cachedLogoDataUrl = null;
  return cachedLogoDataUrl;
};

const buildHtmlBody = async (
  copy: EmailCopy,
  input: SendBookingRequestEmailInput,
  bookingLink: string
): Promise<string> => {
  const logoSrc = await getLogoDataUrl();
  const { renderToStaticMarkup } = await import('react-dom/server');

  const html = renderToStaticMarkup(
    <BookingRequestEmailTemplate
      copy={copy}
      input={input}
      bookingLink={bookingLink}
      logoSrc={logoSrc ?? undefined}
    />
  );

  return `<!doctype html>${html}`;
};

const buildBookingLink = (locale: string, carId: string, quoteId: string) => {
  const safeLocale = normalizeLocale(locale);
  const encodedCarId = encodeURIComponent(carId);
  const encodedQuoteId = encodeURIComponent(quoteId);
  return `https://zodiacsrentacar.com/${safeLocale}/cars/${encodedCarId}/rent?quoteId=${encodedQuoteId}`;
};

const toNullableString = (value?: string | null) =>
  value === undefined ? null : value;

const buildBookingRequestRecord = (
  input: SendBookingRequestEmailInput,
  bookingLink: string
): BookingRequestData => ({
  adminName: toNullableString(input.adminName),
  carId: toNullableString(input.carId),
  carName: toNullableString(input.carName),
  rentalStart: toNullableString(input.rentalStart),
  rentalEnd: toNullableString(input.rentalEnd),
  rentalFee: input.rentalFee ?? null,
  deposit: input.deposit ?? null,
  insurance: input.insurance ?? null,
  deliveryFee: input.deliveryFee ?? null,
  extrasFee: input.extrasFee ?? null,
  locale: toNullableString(input.locale),
  contactName: toNullableString(input.name),
  contactEmail: toNullableString(input.email),
  bookingLink,
});

const markQuoteAsProcessed = async (
  quoteId: string,
  bookingRequestData: BookingRequestData
) => {
  await db.contactQuotes.update({
    where: { id: quoteId },
    data: {
      status: CONTACT_STATUS_QUOTE_SENT,
      updatedAt: new Date(),
      bookingRequestData,
    },
  });
};

export const sendBookingRequestEmailAction = async (
  input: SendBookingRequestEmailInput
): Promise<SendBookingRequestEmailResult> => {
  const recipient = input.email?.trim();

  if (!recipient) {
    return { error: 'Ehhez az ajánlatkéréshez nincs e-mail cím megadva.' };
  }

  if (!input.carId) {
    return { error: 'Nincs autó társítva ehhez az ajánlatkéréshez.' };
  }

  if (!hasMailerConfig() || !BOOKING_FROM_ADDRESS) {
    return {
      error:
        'Az e-mail küldéshez hiányzik a konfiguráció (MAIL_HOST/PORT/USER/PASS vagy BOOKING_EMAIL_FROM/EMAIL_FROM).',
    };
  }

  const locale = normalizeLocale(input.locale);
  const copy = EMAIL_COPY[locale] ?? EMAIL_COPY.en;
  const bookingLink = buildBookingLink(locale, input.carId, input.quoteId);

  const text = buildTextBody(copy, input, bookingLink);
  const html = await buildHtmlBody(copy, input, bookingLink);
  const bookingRequestData = buildBookingRequestRecord(input, bookingLink);

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
    await markQuoteAsProcessed(input.quoteId, bookingRequestData);
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
