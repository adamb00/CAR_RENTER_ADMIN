'use server';

import BookingConfirmationEmail, {
  BOOKING_CONFIRMATION_COPY,
  BookingConfirmationEmailInput,
  buildBookingConfirmationText,
  normalizeConfirmationLocale,
} from '@/components/emails/booking-confirmation-email';
import { getBookingById } from '@/data-service/bookings';
import { getQuoteById } from '@/data-service/quotes';
import { BOOKING_EMAIL_FROM } from '@/lib/constants';
import {
  BOOKING_FROM_ADDRESS,
  MAIL_USER,
  getTransporter,
  hasMailerConfig,
} from '@/lib/mailer';

type SendBookingConfirmationEmailInput = {
  bookingId: string;
};

type SendBookingConfirmationEmailResult = {
  success?: string;
  error?: string;
};

const formatCarLabel = (
  booking: Awaited<ReturnType<typeof getBookingById>>,
  quoteCarName?: string | null
) => {
  return (
    booking?.carLabel ??
    booking?.carId ??
    booking?.payload?.carId ??
    quoteCarName ??
    undefined
  );
};

export const sendBookingConfirmationEmailAction = async ({
  bookingId,
}: SendBookingConfirmationEmailInput): Promise<SendBookingConfirmationEmailResult> => {
  const trimmedBookingId = bookingId?.trim();
  if (!trimmedBookingId) {
    return { error: 'Hiányzik a foglalás azonosítója.' };
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
        'Az e-mail küldéshez hiányzik a konfiguráció (MAIL_HOST/PORT/USER/PASS vagy BOOKING_EMAIL_FROM/EMAIL_FROM).',
    };
  }

  const quote = booking.quoteId ? await getQuoteById(booking.quoteId) : null;
  const bookingRequestData = quote?.bookingRequestData;

  const localeRaw =
    booking.payload?.locale ?? booking.locale ?? quote?.locale ?? 'en';
  const locale = normalizeConfirmationLocale(localeRaw);
  const copy =
    BOOKING_CONFIRMATION_COPY[locale] ?? BOOKING_CONFIRMATION_COPY.en;

  const rentalStart =
    booking.rentalStart ?? booking.payload?.rentalPeriod?.startDate;
  const rentalEnd = booking.rentalEnd ?? booking.payload?.rentalPeriod?.endDate;

  const insuranceFee = bookingRequestData?.insurance ?? null;
  const depositFee =
    insuranceFee && insuranceFee.trim().length > 0
      ? null
      : bookingRequestData?.deposit ?? null;

  const emailInput: BookingConfirmationEmailInput = {
    bookingCode: booking.humanId ?? booking.id,
    name: booking.payload?.contact?.name ?? booking.contactName,
    locale,
    carLabel: formatCarLabel(booking, quote?.carName),
    rentalStart,
    rentalEnd,
    rentalFee: bookingRequestData?.rentalFee ?? null,
    insuranceFee,
    deposit: depositFee,
    extrasFee: bookingRequestData?.extrasFee ?? null,
  };

  const text = buildBookingConfirmationText(copy, emailInput);
  const { renderToStaticMarkup } = await import('react-dom/server');
  const html = `<!doctype html>${renderToStaticMarkup(
    <BookingConfirmationEmail copy={copy} input={emailInput} />
  )}`;

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: BOOKING_FROM_ADDRESS,
      to: recipient,
      subject: `${copy.subject} (${emailInput.bookingCode})`,
      text,
      html,
      replyTo: MAIL_USER ?? BOOKING_EMAIL_FROM,
    });
  } catch (error) {
    console.error('sendBookingConfirmationEmailAction sendMail', error);
    return {
      error: 'Az e-mail küldése közben hiba történt. Próbáld meg később.',
    };
  }

  return { success: copy.successMessage };
};
