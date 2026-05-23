'use server';

import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';

import { db } from '@/lib/db';
import {
  NewAccommodationSchema,
  type NewAccommodationValues,
} from '@/schemas/accommodationSchema';
import { FROM_ADDRESS, getTransporter, MAIL_USER } from '@/lib/mailer';

type UpdateAccommodationInput = {
  id: string;
  values: NewAccommodationValues;
};

const QR_SIZE = 300;
const BRAND_DARK_COLOR = '#219ebc';
const QR_LIGHT_COLOR = '#fff';
const ACCOMMODATION_QR_TARGET_URL =
  process.env.PUBLIC_URL || 'https://zodiacsrentacar.com/en';

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

export const sendQrCode = async (id: string) => {
  const accommodation = await db.accommodation.findFirst({ where: { id } });

  if (!accommodation) {
    return { error: 'Nem található szállás vagy QR kód.' };
  }

  if (!accommodation.email) {
    return { error: 'Nem található email cím a szálláshoz.' };
  }

  try {
    const qrPng = await QRCode.toBuffer(ACCOMMODATION_QR_TARGET_URL, {
      type: 'png',
      width: QR_SIZE,
      margin: 2,
      color: {
        dark: BRAND_DARK_COLOR,
        light: QR_LIGHT_COLOR,
      },
      errorCorrectionLevel: 'H',
    });

    const transporter = await getTransporter();

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: accommodation.email,
      subject: 'QR Code for easier rent at Zodiacs',
      replyTo: MAIL_USER,
      text: `Hello ${accommodation.name},\n\nAttached you can find your accommodation QR code in PNG format.\n\nBest regards,\nZodiacs Rent a Car`,
      attachments: [
        {
          filename: `${accommodation.name || 'accommodation'}-qr.png`,
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
