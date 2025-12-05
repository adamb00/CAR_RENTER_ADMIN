'use server';

import BookingFinalizationEmail, {
  BookingFinalizationEmailInput,
} from '@/components/emails/booking-finalization-email';
import { getBookingById } from '@/data-service/bookings';
import { getQuoteById } from '@/data-service/quotes';
import {
  PUBLIC_SITE_BASE_URL,
  BOOKING_EMAIL_FROM,
  LOGO_URL,
  ADMIN_SIGNATURE,
  RENT_STATUS_FORM_SUBMITTED,
} from '@/lib/constants';
import {
  BOOKING_FROM_ADDRESS,
  MAIL_USER,
  getTransporter,
  hasMailerConfig,
} from '@/lib/mailer';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getFinalizationCopy } from '@/components/emails/utils/finalization-copy';

type SendBookingFinalizationEmailInput = {
  bookingId: string;
  signerName: string;
};

type SendBookingFinalizationEmailResult = {
  success?: string;
  error?: string;
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
        'sendBookingFinalizationEmailAction logo load failed',
        logoPath,
        error
      );
    }
  }

  cachedLogoDataUrl = null;
  return cachedLogoDataUrl;
};

const formatAddress = (value?: {
  country?: string;
  postalCode?: string;
  city?: string;
  street?: string;
  streetType?: string;
  doorNumber?: string;
}) => {
  if (!value) return null;
  const parts = [
    value.country,
    value.postalCode,
    value.city,
    value.street,
    value.streetType,
    value.doorNumber,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
};

const formatPlainPrice = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? `${trimmed} €` : '—';
};

const formatPlain = (value?: string | null) => {
  if (!value) return '—';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '—';
};

const formatPlainDate = (value?: string | null, locale?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale ?? 'hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const parseAmount = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return 0;
  const normalized = trimmed.replace(/[^\d,.\-]/g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeInsuranceSelection = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();
  if (
    lowered === 'false' ||
    lowered === 'no' ||
    lowered === 'nem' ||
    lowered === '0'
  ) {
    return null;
  }
  return trimmed;
};

export const sendBookingFinalizationEmailAction = async ({
  bookingId,
  signerName,
}: SendBookingFinalizationEmailInput): Promise<SendBookingFinalizationEmailResult> => {
  const trimmedBookingId = bookingId?.trim();
  const trimmedName = signerName?.trim();

  if (!trimmedBookingId) {
    return { error: 'Hiányzik a foglalás azonosítója.' };
  }

  if (!trimmedName) {
    return { error: 'Add meg az aláíró nevét az e-mail küldése előtt.' };
  }

  const booking = await getBookingById(trimmedBookingId);
  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const recipient =
    booking.contactEmail ??
    booking.payload?.contact?.email ??
    booking.payload?.invoice?.email ??
    null;

  if (!recipient) {
    return { error: 'Ehhez a foglaláshoz nincs megadható e-mail cím.' };
  }

  if (!hasMailerConfig() || !BOOKING_FROM_ADDRESS) {
    return {
      error:
        'Az e-mail küldéséhez hiányzik a konfiguráció (MAIL_HOST/PORT/USER/PASS vagy BOOKING_EMAIL_FROM/EMAIL_FROM).',
    };
  }

  const quote =
    booking.quoteId && booking.quoteId.length > 0
      ? await getQuoteById(booking.quoteId)
      : null;

  const carId = booking.carId;

  const requestData = quote?.bookingRequestData;
  const manualPricing = booking.payload?.pricing;
  const rentalStart =
    booking.rentalStart ?? booking.payload?.rentalPeriod?.startDate;
  const rentalEnd = booking.rentalEnd ?? booking.payload?.rentalPeriod?.endDate;
  const localeRaw = booking.payload?.locale ?? booking.locale;
  const effectiveLocale = localeRaw && localeRaw.length > 0 ? localeRaw : 'hu';
  const copy = getFinalizationCopy(localeRaw);

  const thankYouUrl = `${PUBLIC_SITE_BASE_URL}/${effectiveLocale}/rent/thank-you?rentId=${encodeURIComponent(
    booking.id
  )}`;
  const contactUrl = `${PUBLIC_SITE_BASE_URL}/${effectiveLocale}/contact`;
  const manageBaseUrl = `${PUBLIC_SITE_BASE_URL}/${effectiveLocale}/cars/${carId}/rent?rentId=${encodeURIComponent(
    booking.id
  )}`;
  const modifyUrl = `${manageBaseUrl}?action=modify`;
  const cancelUrl = `${PUBLIC_SITE_BASE_URL}/${effectiveLocale}/rent/manage?action=cancel`;

  const rawInsurance =
    requestData?.insurance ?? manualPricing?.insurance ?? null;
  const normalizedInsurance = normalizeInsuranceSelection(rawInsurance);
  const insuranceConsent = booking.payload?.consents?.insurance;
  const hasInsurance =
    insuranceConsent != null
      ? Boolean(insuranceConsent)
      : Boolean(normalizedInsurance);
  const insuranceAmount = hasInsurance ? normalizedInsurance : null;
  const depositSource = requestData?.deposit ?? manualPricing?.deposit ?? null;
  const depositValue = hasInsurance ? null : depositSource;
  const rentalFeeValue =
    requestData?.rentalFee ?? manualPricing?.rentalFee ?? null;
  const deliveryFeeValue =
    requestData?.deliveryFee ?? manualPricing?.deliveryFee ?? null;
  const extrasFeeValue =
    requestData?.extrasFee ?? manualPricing?.extrasFee ?? null;
  const totalAmount =
    parseAmount(rentalFeeValue) +
    parseAmount(insuranceAmount) +
    parseAmount(depositValue) +
    parseAmount(deliveryFeeValue) +
    parseAmount(extrasFeeValue);
  const totalFee =
    totalAmount > 0
      ? Number.isInteger(totalAmount)
        ? String(totalAmount)
        : totalAmount.toFixed(2)
      : null;

  const emailInput: BookingFinalizationEmailInput = {
    bookingCode: booking.humanId ?? booking.id,
    bookingId: booking.id,
    carLabel:
      booking.carLabel ?? booking.carId ?? booking.payload?.carId ?? null,
    rentalStart,
    rentalEnd,
    rentalFee: rentalFeeValue,
    deposit: depositValue,
    insurance: insuranceAmount,
    deliveryFee: deliveryFeeValue,
    extrasFee: extrasFeeValue,
    totalFee,
    extrasList: booking.payload?.extras ?? [],
    locale: localeRaw,
    adults: booking.payload?.adults ?? null,
    children: booking.payload?.children?.length ?? null,
    contactName: booking.payload?.contact?.name ?? booking.contactName,
    contactEmail: booking.payload?.contact?.email ?? booking.contactEmail,
    contactPhone: booking.contactPhone ?? null,
    invoice: {
      name: booking.payload?.invoice?.name ?? null,
      email: booking.payload?.invoice?.email ?? null,
      phone: booking.payload?.invoice?.phoneNumber ?? null,
      address: formatAddress(booking.payload?.invoice?.location ?? undefined),
    },
    delivery: {
      placeType: booking.payload?.delivery?.placeType ?? null,
      locationName: booking.payload?.delivery?.locationName ?? null,
      address: formatAddress(booking.payload?.delivery?.address ?? undefined),
      arrivalFlight: booking.payload?.delivery?.arrivalFlight ?? null,
      departureFlight: booking.payload?.delivery?.departureFlight ?? null,
    },
    signerName: trimmedName,
    thankYouUrl,
    contactUrl,
    modifyUrl,
    cancelUrl,
  };
  const rentalPeriodText = `${formatPlainDate(
    rentalStart,
    localeRaw
  )} → ${formatPlainDate(rentalEnd, localeRaw)}`;
  const extrasListText =
    emailInput.extrasList && emailInput.extrasList.length > 0
      ? emailInput.extrasList.join(', ')
      : '—';

  const logoSrc = await getLogoDataUrl();
  const subject = `${copy.subject} - ${emailInput.bookingCode}`;
  const textLines: string[] = [
    copy.intro,
    copy.instructions,
    copy.retainNote,
    '',
    copy.manageIntro,
    `${copy.modifyCta}: ${modifyUrl}`,
    `${copy.cancelCta}: ${cancelUrl}`,
    '',
    `${copy.labels.bookingCode}: ${emailInput.bookingCode}`,
    `${copy.labels.car}: ${formatPlain(emailInput.carLabel)}`,
    `${copy.labels.period}: ${rentalPeriodText}`,
    `${copy.labels.rentalFee}: ${formatPlainPrice(emailInput.rentalFee)}`,
  ];
  if (hasInsurance) {
    textLines.push(
      `${copy.labels.insurance}: ${formatPlainPrice(emailInput.insurance)}`
    );
  }
  if (depositValue) {
    textLines.push(
      `${copy.labels.deposit}: ${formatPlainPrice(emailInput.deposit)}`
    );
  }
  textLines.push(
    `${copy.labels.deliveryFee}: ${formatPlainPrice(emailInput.deliveryFee)}`,
    `${copy.labels.extrasFee}: ${formatPlainPrice(emailInput.extrasFee)}`,
    `${copy.labels.extrasList}: ${extrasListText}`,
    `${copy.labels.adults}: ${
      emailInput.adults != null ? String(emailInput.adults) : '—'
    }`,
    `${copy.labels.children}: ${
      emailInput.children != null ? String(emailInput.children) : '—'
    }`,
    `${copy.labels.contactName}: ${formatPlain(emailInput.contactName)}`,
    `${copy.labels.contactEmail}: ${formatPlain(emailInput.contactEmail)}`,
    `${copy.labels.contactPhone}: ${formatPlain(emailInput.contactPhone)}`,
    `${copy.labels.invoiceName}: ${formatPlain(emailInput.invoice?.name)}`,
    `${copy.labels.invoiceEmail}: ${formatPlain(emailInput.invoice?.email)}`,
    `${copy.labels.invoicePhone}: ${formatPlain(emailInput.invoice?.phone)}`,
    `${copy.labels.invoiceAddress}: ${formatPlain(
      emailInput.invoice?.address
    )}`,
    `${copy.labels.deliveryLocation}: ${formatPlain(
      emailInput.delivery?.locationName
    )}`,
    `${copy.labels.deliveryType}: ${formatPlain(
      emailInput.delivery?.placeType
    )}`,
    `${copy.labels.deliveryAddress}: ${formatPlain(
      emailInput.delivery?.address
    )}`,
    `${copy.labels.arrivalFlight}: ${formatPlain(
      emailInput.delivery?.arrivalFlight
    )}`,
    `${copy.labels.departureFlight}: ${formatPlain(
      emailInput.delivery?.departureFlight
    )}`,
    ''
  );
  if (emailInput.totalFee) {
    textLines.push(
      `${copy.labels.totalLabel}: ${formatPlainPrice(emailInput.totalFee)}`,
      ''
    );
  }
  textLines.push(
    `${copy.confirmCta}: ${thankYouUrl}`,
    `${copy.questionCta}: ${contactUrl}`,
    '',
    `${copy.closing},`,
    emailInput.signerName,
    ADMIN_SIGNATURE.company
  );
  const { renderToStaticMarkup } = await import('react-dom/server');
  const html = `<!doctype html>${renderToStaticMarkup(
    <BookingFinalizationEmail
      input={emailInput}
      copy={copy}
      logoSrc={logoSrc ?? undefined}
    />
  )}`;
  const text = textLines.join('\n');

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: BOOKING_FROM_ADDRESS,
      to: recipient,
      subject,
      text,
      html,
      replyTo: MAIL_USER ?? BOOKING_EMAIL_FROM,
    });
  } catch (error) {
    console.error('sendBookingFinalizationEmailAction sendMail', error);
    return {
      error: 'Az e-mail küldése közben hiba történt. Próbáld meg később.',
    };
  }

  try {
    await db.rentRequests.update({
      where: { id: booking.id },
      data: {
        status: RENT_STATUS_FORM_SUBMITTED,
        updatedAt: new Date(),
      },
    });
    revalidatePath('/');
    revalidatePath(`/${booking.id}`);
  } catch (error) {
    console.error('sendBookingFinalizationEmailAction updateStatus', error);
    return {
      error:
        'Az e-mail elküldve, de a foglalás státuszát nem sikerült frissíteni.',
    };
  }

  return {
    success: 'Foglalás véglegesítő e-mail elküldve és státusz frissítve.',
  };
};
