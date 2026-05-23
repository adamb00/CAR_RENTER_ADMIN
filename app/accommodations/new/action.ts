'use server';
import { db } from '@/lib/db';
import {
  NewAccommodationSchema,
  NewAccommodationValues,
} from '@/schemas/accommodationSchema';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';

const ACCOMMODATION_QR_TARGET_URL =
  process.env.PUBLIC_URL || 'https://zodiacsrentacar.com/en';

const QR_SIZE = 300;
const BRAND_DARK_COLOR = '#219ebc';
const QR_LIGHT_COLOR = '#fff';

export const createNewAccommodationAction = async (
  values: NewAccommodationValues,
) => {
  const validated = await NewAccommodationSchema.safeParseAsync(values);

  if (!validated.success) {
    throw new Error(validated.error.message);
  }

  const res = await db.accommodation.create({
    data: validated.data,
  });

  if (res && res.id) {
    const qrSvg = await QRCode.toString(ACCOMMODATION_QR_TARGET_URL, {
      type: 'svg',
      width: QR_SIZE,
      margin: 2,
      color: {
        dark: BRAND_DARK_COLOR,
        light: QR_LIGHT_COLOR,
      },
      errorCorrectionLevel: 'H',
    });

    await db.accommodation.update({
      where: { id: res.id },
      data: { qrCode: qrSvg },
    });

    redirect('/accommodations');
  }

  throw new Error('A szállás létrehozása sikertelen.');
};
