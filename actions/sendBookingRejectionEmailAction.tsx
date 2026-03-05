'use server';

import BookingRejectionEmail, {
  BookingRejectionEmailInput,
  buildBookingRejectionText,
} from '@/components/emails/booking-rejection-email';
import { getBookingById } from '@/data-service/bookings';
import {
  BOOKING_EMAIL_FROM,
  LOGO_URL,
  RENT_STATUS_CANCELLED,
} from '@/lib/constants';
import { db } from '@/lib/db';
import {
  BOOKING_FROM_ADDRESS,
  MAIL_USER,
  getTransporter,
  hasMailerConfig,
} from '@/lib/mailer';
import { getBookingRejectionCopy } from '@/components/emails/utils/rejection-copy';
import { revalidatePath } from 'next/cache';

type SendBookingRejectionEmailInput = {
  bookingId: string;
  signerName: string;
};

type SendBookingRejectionEmailResult = {
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
    join(process.cwd(), 'public', file),
  );

  for (const logoPath of logoPaths) {
    try {
      const buffer = readFileSync(logoPath);
      cachedLogoDataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
      return cachedLogoDataUrl;
    } catch (error) {
      console.error(
        'sendBookingRejectionEmailAction logo load failed',
        logoPath,
        error,
      );
    }
  }

  cachedLogoDataUrl = null;
  return cachedLogoDataUrl;
};

export const sendBookingRejectionEmailAction = async ({
  bookingId,
  signerName,
}: SendBookingRejectionEmailInput): Promise<SendBookingRejectionEmailResult> => {
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
        'Az e-mail küldéshez hiányzik a konfiguráció (MAIL_HOST/PORT/USER/PASS vagy BOOKING_EMAIL_FROM/EMAIL_FROM).',
    };
  }

  const localeRaw = booking.payload?.locale ?? booking.locale ?? 'en';
  const copy = getBookingRejectionCopy(localeRaw);
  const emailInput: BookingRejectionEmailInput = {
    bookingCode: booking.humanId ?? booking.id,
    name: booking.payload?.contact?.name ?? booking.contactName,
    locale: localeRaw,
    carLabel:
      booking.carLabel ?? booking.carId ?? booking.payload?.carId ?? null,
    rentalStart: booking.rentalStart ?? booking.payload?.rentalPeriod?.startDate,
    rentalEnd: booking.rentalEnd ?? booking.payload?.rentalPeriod?.endDate,
    signerName: trimmedName,
  };

  const logoSrc = await getLogoDataUrl();
  const text = buildBookingRejectionText(copy, emailInput);
  const { renderToStaticMarkup } = await import('react-dom/server');
  const html = `<!doctype html>${renderToStaticMarkup(
    <BookingRejectionEmail copy={copy} input={emailInput} logoSrc={logoSrc} />,
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
    console.error('sendBookingRejectionEmailAction sendMail', error);
    return {
      error: 'Az e-mail küldése közben hiba történt. Próbáld meg később.',
    };
  }

  try {
    await db.rentRequests.update({
      where: { id: booking.id },
      data: {
        status: RENT_STATUS_CANCELLED,
        assignedFleetVehicleId: null,
        assignedFleetPlate: null,
        updatedAt: new Date(),
      },
    });
    revalidatePath('/');
    revalidatePath(`/${booking.id}`);
  } catch (error) {
    console.error('sendBookingRejectionEmailAction updateStatus', error);
    return {
      error:
        'Az e-mail elküldve, de a foglalás státuszát nem sikerült frissíteni.',
    };
  }

  return { success: copy.successMessage };
};
