'use server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const deleteHandoverCostAction = async (id: string) => {
  await db.bookingHandoverCost.delete({ where: { id } });
  revalidatePath('/costs');
};

export const editHandoverCostAction = async (id: string, amount: number) => {
  await db.bookingHandoverCost.update({
    where: { id },
    data: { amount },
  });
  revalidatePath('/costs');
};
