'use server';

import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';

import { db } from '@/lib/db';
import {
  NewAccommodationSchema,
  type NewAccommodationValues,
} from '@/schemas/accommodationSchema';
import { FROM_ADDRESS, getTransporter, MAIL_USER } from '@/lib/mailer';
import { getAccommodationBookingCommissionByIds } from '@/data-service/accommodations';
import { auth } from '@/auth';

type UpdateAccommodationInput = {
  id: string;
  values: NewAccommodationValues;
};

type QrDownloadResult =
  | {
      error: string;
      success?: never;
      dataUrl?: never;
      fileName?: never;
    }
  | {
      error?: never;
      success: string;
      dataUrl: string;
      fileName: string;
    };

type QrSendResult =
  | {
      error: string;
      success?: never;
    }
  | {
      error?: never;
      success: string;
    };

const QR_SIZE = 300;
const BRAND_DARK_COLOR = '#219ebc';
const QR_LIGHT_COLOR = '#fff';

const QR_BASE_OPTIONS = {
  width: QR_SIZE,
  margin: 2,
  color: {
    dark: BRAND_DARK_COLOR,
    light: QR_LIGHT_COLOR,
  },
  errorCorrectionLevel: 'H' as const,
};

const QR_BUFFER_OPTIONS = {
  ...QR_BASE_OPTIONS,
  type: 'png' as const,
};

const QR_DATA_URL_OPTIONS = {
  ...QR_BASE_OPTIONS,
  type: 'image/png' as const,
};

const buildAccommodationContactUrl = (accommodationId: string) => {
  const publicUrl = process.env.PUBLIC_URL;
  if (!publicUrl) return null;

  const registerUrl = new URL('/contact', publicUrl);
  registerUrl.searchParams.set('accommodationId', accommodationId);
  return decodeURIComponent(registerUrl.toString());
};

const buildQrFileName = (name?: string | null) => {
  const baseName =
    name
      ?.trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'accommodation';

  return `${baseName}-qr.png`;
};

export const updateAccommodationAction = async ({
  id,
  values,
}: UpdateAccommodationInput) => {
  const validated = await NewAccommodationSchema.safeParseAsync(values);

  if (!validated.success) {
    return { error: 'Hibás adatok, kérjük ellenőrizd az űrlapot.' };
  }

  try {
    await db.accommodation.update({
      where: { id },
      data: validated.data,
    });

    revalidatePath('/accommodations');
    revalidatePath(`/accommodations/${id}`);

    return { success: 'A szállás adatai frissültek.' };
  } catch (error) {
    console.error('updateAccommodationAction', error);
    return {
      error: 'Nem sikerült módosítani a szállást. Próbáld meg később.',
    };
  }
};

export const downloadQrCode = async (id: string): Promise<QrDownloadResult> => {
  const accommodation = await db.accommodation.findFirst({
    where: { id },
    select: { id: true, name: true },
  });

  if (!accommodation) {
    return { error: 'Nem található szállás vagy QR kód.' };
  }

  const qrTargetUrl = buildAccommodationContactUrl(accommodation.id);
  if (!qrTargetUrl) {
    return { error: 'A PUBLIC_URL nincs beállítva.' };
  }

  try {
    const dataUrl = await QRCode.toDataURL(qrTargetUrl, QR_DATA_URL_OPTIONS);

    return {
      success: 'A QR kód letöltése elindult.',
      dataUrl,
      fileName: buildQrFileName(accommodation.name),
    };
  } catch (err) {
    console.error('downloadQrCode', err);
    return { error: 'Nem sikerült előkészíteni a QR kód letöltését.' };
  }
};

export const sendQrCode = async (id: string): Promise<QrSendResult> => {
  const accommodation = await db.accommodation.findFirst({ where: { id } });

  if (!accommodation) {
    return { error: 'Nem található szállás vagy QR kód.' };
  }

  if (!accommodation.email) {
    return { error: 'Nem található email cím a szálláshoz.' };
  }

  const qrTargetUrl = buildAccommodationContactUrl(accommodation.id);
  if (!qrTargetUrl) {
    return { error: 'A PUBLIC_URL nincs beállítva.' };
  }

  try {
    const qrPng = await QRCode.toBuffer(qrTargetUrl, QR_BUFFER_OPTIONS);

    const transporter = await getTransporter();

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: accommodation.email,
      subject: 'QR Code for easier rent at Zodiacs',
      replyTo: MAIL_USER,
      text: `Hello ${accommodation.name},\n\nAttached you can find your accommodation QR code in PNG format.\n\nBest regards,\nZodiacs Rent a Car`,
      attachments: [
        {
          filename: buildQrFileName(accommodation.name),
          content: qrPng,
          contentType: 'image/png',
        },
      ],
    });

    return { success: 'A QR kód emailben elküldve PNG csatolmányként.' };
  } catch (err) {
    console.error('sendQrCode', err);
    return { error: 'Nem sikerült elküldeni a QR kódot emailben.' };
  }
};

export const bookTipsAction = async (ids: string[]) => {
  const session = await auth();
  if (!session?.user) return null;

  const accommodationBookingCommissions =
    await getAccommodationBookingCommissionByIds(ids);
  const accommodationIds = new Set(
    accommodationBookingCommissions.map(
      (commission) => commission.accommodationId,
    ),
  );

  await Promise.all(
    accommodationBookingCommissions.map(({ id }) =>
      db.accommodationBookingCommission.update({
        where: { id },
        data: { status: 'paid', paidAt: new Date(), userId: session.user?.id },
      }),
    ),
  );

  revalidatePath('/accommodations');
  accommodationIds.forEach((accommodationId) => {
    revalidatePath(`/accommodations/${accommodationId}`);
  });
};
