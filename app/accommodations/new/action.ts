'use server';
import { db } from '@/lib/db';
import {
  NewAccommodationSchema,
  NewAccommodationValues,
} from '@/schemas/accommodationSchema';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';

const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://192.168.0.33:3001/en'
    : process.env.BASE_URL;

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

  if (!BASE_URL) {
    throw new Error('BASE_URL nincs beállítva.');
  }

  const res = await db.accommodation.create({
    data: validated.data,
  });

  if (res && res.id) {
    const registerUrl = new URL('/contact', BASE_URL);
    registerUrl.searchParams.set('accommodationId', res.id);
    const decoded = decodeURIComponent(registerUrl.toString());
    const qrSvg = await QRCode.toString(decoded, {
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
