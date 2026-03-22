'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';

type CreateRenterInput = {
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

export const createRenterAction = async (input: CreateRenterInput) => {
  const name = toOptionalString(input.name);
  if (!name) {
    return { error: 'A bérlő neve kötelező.' };
  }

  try {
    const rows = await db.$queryRaw<RenterActionRow[]>`
      INSERT INTO "Renters" (
        "name",
        "email",
        "phone",
        "taxId",
        "companyName",
        "paymentMethod"
      )
      VALUES (
        ${name},
        ${toOptionalString(input.email)},
        ${toOptionalString(input.phone)},
        ${toOptionalString(input.taxId)},
        ${toOptionalString(input.companyName)},
        ${toOptionalString(input.paymentMethod)}
      )
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

    revalidatePath('/renters');
    revalidatePath('/bookings/new');
    return {
      success: 'A bérlő elmentve.',
      renter: renter
        ? {
            ...renter,
            updatedAt: renter.updatedAt.toISOString(),
          }
        : null,
    };
  } catch (error) {
    console.error('createRenterAction', error);
    return { error: 'A bérlő mentése nem sikerült.' };
  }
};
