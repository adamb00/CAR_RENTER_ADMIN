'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';

type UpdateRenterInput = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  companyName?: string;
  paymentMethod?: string;
};

type RenterActionRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  companyName: string | null;
  paymentMethod: string | null;
  updatedAt: Date;
};

const toOptionalString = (value?: string | null) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const updateRenterAction = async (input: UpdateRenterInput) => {
  const id = toOptionalString(input.id);
  const name = toOptionalString(input.name);

  if (!id) {
    return { error: 'Hiányzó bérlő azonosító.' };
  }
  if (!name) {
    return { error: 'A bérlő neve kötelező.' };
  }

  try {
    const rows = await db.$queryRaw<RenterActionRow[]>`
      UPDATE "Renters"
      SET
        "name" = ${name},
        "email" = ${toOptionalString(input.email)},
        "phone" = ${toOptionalString(input.phone)},
        "taxId" = ${toOptionalString(input.taxId)},
        "companyName" = ${toOptionalString(input.companyName)},
        "paymentMethod" = ${toOptionalString(input.paymentMethod)},
        "updatedAt" = timezone('utc'::text, now())
      WHERE "id" = ${id}::uuid
      RETURNING
        "id",
        "name",
        "email",
        "phone",
        "taxId",
        "companyName",
        "paymentMethod",
        "updatedAt"
    `;
    const renter = rows[0];
    if (!renter) {
      return { error: 'A bérlő nem található.' };
    }

    revalidatePath('/renters');
    revalidatePath('/bookings/new');
    return {
      success: 'A bérlő frissítve.',
      renter: {
        ...renter,
        updatedAt: renter.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('updateRenterAction', error);
    return { error: 'A bérlő frissítése nem sikerült.' };
  }
};
