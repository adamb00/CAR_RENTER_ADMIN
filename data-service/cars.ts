'use server';
import { db } from '@/lib/db';

export const getCarById = async (carId: string) => {
  return db.car.findUnique({
    where: { id: carId },
    select: { manufacturer: true, model: true, images: true },
  });
};
