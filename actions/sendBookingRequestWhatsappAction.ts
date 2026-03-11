'use server';

import type { BookingRequestOfferInput } from '@/components/emails/booking-request-email';
import { EMAIL_COPY } from '@/components/emails/utils/email-copy';
import { LOCALIZED_STATIC } from '@/components/emails/utils/localized-static';
import {
  CONTACT_STATUS_QUOTE_SENT,
  PUBLIC_SITE_BASE_URL,
} from '@/lib/constants';
import { db } from '@/lib/db';
import {
  hasWhatsappApiConfig,
  sendWhatsappTextMessage,
} from '@/lib/whatsapp';
import { revalidatePath } from 'next/cache';

type SendBookingRequestWhatsappInput = {
  quoteId: string;
  phone: string | null | undefined;
  name?: string | null;
  locale?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  adminName?: string | null;
  offers: BookingRequestOfferInput[];
};

type SendBookingRequestWhatsappResult = {
  success?: string;
  error?: string;
  whatsappUrl?: string;
  sentDirectly?: boolean;
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

type ResolvedOffer = BookingRequestOfferInput & {
  bookingLink: string;
};

const normalizeLocale = (locale?: string | null) => {
  if (!locale) return 'en';
  const normalized = locale.trim().toLowerCase();
  return EMAIL_COPY[normalized] ? normalized : 'en';
};

const toNullableString = (value?: string | null) =>
  value == null ? null : value;

const formatPrice = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? `${trimmed} €` : '—';
};

const sanitizePhoneForWhatsapp = (value?: string | null) => {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
};

const buildBookingLink = (
  locale: string,
  carId: string,
  quoteId: string,
  offerIndex: number,
) => {
  const base = PUBLIC_SITE_BASE_URL.replace(/\/+$/, '');
  const encodedCarId = encodeURIComponent(carId);
  const encodedQuoteId = encodeURIComponent(quoteId);
  return `${base}/${locale}/cars/${encodedCarId}/rent?quoteId=${encodedQuoteId}&offer=${offerIndex}`;
};

const buildWhatsappText = ({
  locale,
  name,
  rentalStart,
  rentalEnd,
  offers,
  adminName,
}: {
  locale: string;
  name?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  offers: ResolvedOffer[];
  adminName?: string | null;
}) => {
  const copy = EMAIL_COPY[locale] ?? EMAIL_COPY.en;
  const staticText = LOCALIZED_STATIC[locale] ?? LOCALIZED_STATIC.en;
  const lines: string[] = [];
  lines.push(copy.greeting(name).replace(/,+$/, ''));
  lines.push(copy.thankYou);

  if (rentalStart || rentalEnd) {
    lines.push(`${rentalStart ?? '—'} -> ${rentalEnd ?? '—'}`);
  }

  offers.forEach((offer, index) => {
    lines.push('');
    lines.push(`${staticText.offerLabel} ${index + 1}`);
    lines.push(offer.carName?.trim() || offer.carId || '—');
    lines.push(`${staticText.rentalFeeLabel}: ${formatPrice(offer.rentalFee)}`);
    lines.push(`${staticText.insuranceLabel}: ${formatPrice(offer.insurance)}`);
    lines.push(`${staticText.depositLabel}: ${formatPrice(offer.deposit)}`);
    lines.push(
      `${staticText.deliveryFeeLabel}: ${formatPrice(offer.deliveryFee)}`,
    );
    lines.push(
      `${staticText.deliveryLocationLabel}: ${
        offer.deliveryLocation?.trim() || '—'
      }`,
    );
    lines.push(`${staticText.extrasFeeLabel}: ${formatPrice(offer.extrasFee)}`);
    lines.push(`${copy.cta}: ${offer.bookingLink}`);

    const images = Array.isArray(offer.carImages)
      ? offer.carImages
          .map((image) => (typeof image === 'string' ? image.trim() : ''))
          .filter((image) => image.length > 0)
      : [];
    if (images.length > 0) {
      lines.push(`${staticText.carImagesLabel}:`);
      images.forEach((image) => lines.push(image));
    }
  });

  lines.push('');
  lines.push(copy.signature);
  if (adminName?.trim()) {
    lines.push(adminName.trim());
  }

  return lines.join('\n');
};

const buildBookingRequestRecord = ({
  quoteId,
  locale,
  name,
  rentalStart,
  rentalEnd,
  adminName,
  offers,
}: {
  quoteId: string;
  locale: string;
  name?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  adminName?: string | null;
  offers: ResolvedOffer[];
}): BookingRequestOfferData[] =>
  offers.map((offer) => ({
    adminName: toNullableString(adminName),
    carId: toNullableString(offer.carId),
    carName: toNullableString(offer.carName),
    rentalStart: toNullableString(rentalStart),
    rentalEnd: toNullableString(rentalEnd),
    rentalFee: toNullableString(offer.rentalFee),
    deposit: toNullableString(offer.deposit),
    insurance: toNullableString(offer.insurance),
    deliveryFee: toNullableString(offer.deliveryFee),
    deliveryLocation: toNullableString(offer.deliveryLocation),
    extrasFee: toNullableString(offer.extrasFee),
    locale: toNullableString(locale),
    contactName: toNullableString(name),
    contactEmail: null,
    bookingLink: offer.bookingLink,
  }));

export const sendBookingRequestWhatsappAction = async (
  input: SendBookingRequestWhatsappInput,
): Promise<SendBookingRequestWhatsappResult> => {
  const phone = sanitizePhoneForWhatsapp(input.phone);
  if (!phone) {
    return { error: 'Ehhez az ajánlatkéréshez nincs érvényes telefonszám.' };
  }

  if (!Array.isArray(input.offers) || input.offers.length === 0) {
    return { error: 'Nincs ajánlat megadva ehhez az ajánlatkéréshez.' };
  }
  if (input.offers.some((offer) => !offer.carId || !offer.carId.trim())) {
    return { error: 'Az ajánlat(ok)ban nincs autó kiválasztva.' };
  }

  const locale = normalizeLocale(input.locale);
  const offers: ResolvedOffer[] = input.offers.map((offer, index) => ({
    ...offer,
    bookingLink: buildBookingLink(locale, offer.carId as string, input.quoteId, index),
  }));

  const text = buildWhatsappText({
    locale,
    name: input.name,
    rentalStart: input.rentalStart,
    rentalEnd: input.rentalEnd,
    offers,
    adminName: input.adminName,
  });
  const manualWhatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
    text,
  )}`;

  let shouldOpenManualWhatsapp = false;
  let successMessage = 'WhatsApp üzenet elküldve.';

  if (hasWhatsappApiConfig()) {
    const dispatchResult = await sendWhatsappTextMessage({
      to: phone,
      body: text,
    });
    if (!dispatchResult.sent) {
      console.error(
        'sendBookingRequestWhatsappAction sendWhatsappTextMessage',
        dispatchResult.errorMessage,
      );
      return {
        error: `A WhatsApp küldés sikertelen volt: ${dispatchResult.errorMessage}`,
      };
    }
  } else {
    shouldOpenManualWhatsapp = true;
    successMessage =
      'WhatsApp API nincs beállítva, a rendszer megnyitja a kézi küldési linket.';
  }

  const bookingRequestData = buildBookingRequestRecord({
    quoteId: input.quoteId,
    locale,
    name: input.name,
    rentalStart: input.rentalStart,
    rentalEnd: input.rentalEnd,
    adminName: input.adminName,
    offers,
  });

  try {
    await db.contactQuotes.update({
      where: { id: input.quoteId },
      data: {
        status: CONTACT_STATUS_QUOTE_SENT,
        updatedAt: new Date(),
        bookingRequestData,
      },
    });

    await db.$executeRaw`
      UPDATE "ContactQuotes"
      SET "signerName" = ${toNullableString(input.adminName)}
      WHERE "id" = ${input.quoteId}::uuid
    `;
  } catch (error) {
    console.error('sendBookingRequestWhatsappAction statusUpdate', error);
    return {
      error:
        'A WhatsApp üzenet kiküldése megtörtént, de a státuszt nem sikerült frissíteni az adatbázisban.',
    };
  }

  revalidatePath('/quotes');
  revalidatePath(`/quotes/${input.quoteId}`);

  return {
    success: successMessage,
    whatsappUrl: shouldOpenManualWhatsapp ? manualWhatsappUrl : undefined,
    sentDirectly: !shouldOpenManualWhatsapp,
  };
};
