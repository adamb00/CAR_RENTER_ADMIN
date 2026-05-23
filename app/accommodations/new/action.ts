'use server';
import { db } from '@/lib/db';
import {
  NewAccommodationSchema,
  NewAccommodationValues,
} from '@/schemas/accommodationSchema';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';

const QR_SIZE = 300;
const BRAND_DARK_COLOR = '#219ebc';
const QR_LIGHT_COLOR = '#fff';

const buildAccommodationContactUrl = (accommodationId: string) => {
  const publicUrl = process.env.PUBLIC_URL;
  if (!publicUrl) return null;

  const registerUrl = new URL('/contact', publicUrl);
  registerUrl.searchParams.set('accommodationId', accommodationId);
  return decodeURIComponent(registerUrl.toString());
};

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
    const qrTargetUrl = buildAccommodationContactUrl(res.id);
    if (!qrTargetUrl) {
      throw new Error('A PUBLIC_URL nincs beállítva.');
    }

    const qrSvg = await QRCode.toString(qrTargetUrl, {
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
