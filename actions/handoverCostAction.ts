'use server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const deleteHandoverCostAction = async (id: string) => {
  await db.bookingHandoverCost.delete({ where: { id } });
  revalidatePath('/costs');
};

const parseCostDate = (value?: string | null) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(`${trimmed}T12:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

export const editHandoverCostAction = async (
  id: string,
  amount: number,
  createdAt?: string,
) => {
  const costDate = parseCostDate(createdAt);

  await db.bookingHandoverCost.update({
    where: { id },
    data: {
      amount,
      ...(costDate
        ? {
            createdAt: costDate,
            updatedAt: costDate,
          }
        : {}),
    },
  });
  revalidatePath('/costs');
};
