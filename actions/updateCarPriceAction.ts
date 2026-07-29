'use server';

import { revalidatePath } from 'next/cache';

import {
  areAuditValuesEqual,
  getAuditActor,
  recordAudit,
} from '@/lib/audit';
import { db } from '@/lib/db';

export const updateCarPriceAction = async (
  carId: string,
  date: string,
  island: string,
  price: number,
) => {
  const dateValue = new Date(date);
  const where = {
    carId_date_island: {
      carId,
      date: dateValue,
      island,
    },
  } as any;
  const actor = await getAuditActor();

  const result = await db.$transaction(async (tx) => {
    const existingPrice = await tx.carPrices.findUnique({
      where,
      select: { id: true, price: true },
    });

    const savedPrice = await tx.carPrices.upsert({
      where,
      update: {
        price,
      },
      create: {
        carId,
        date: dateValue,
        island,
        price,
      },
    });

    if (!areAuditValuesEqual(existingPrice?.price ?? null, price)) {
      await recordAudit(
        {
          entityType: 'CarPrices',
          entityId: savedPrice.id,
          action: existingPrice ? 'update' : 'create',
          field: 'price',
          oldValue: existingPrice?.price ?? null,
          newValue: price,
          metadata: { carId, date, island },
          ...actor,
        },
        tx,
      );
    }

    return savedPrice;
  });

  revalidatePath('/audit');
  return result;
};

export const updateCarPriceActionFlagAction = async (
  carId: string,
  date: string,
  island: string,
  action: boolean,
) => {
  const dateValue = new Date(date);
  const where = {
    carId_date_island: {
      carId,
      date: dateValue,
      island,
    },
  } as any;
  const actor = await getAuditActor();

  const result = await db.$transaction(async (tx) => {
    const existingPrice = await tx.carPrices.findUnique({
      where,
      select: { id: true, action: true },
    });

    const savedPrice = await tx.carPrices.upsert({
      where,
      update: {
        action,
      },
      create: {
        carId,
        date: dateValue,
        island,
        price: 0,
        action,
      },
    });

    if (!areAuditValuesEqual(existingPrice?.action ?? null, action)) {
      await recordAudit(
        {
          entityType: 'CarPrices',
          entityId: savedPrice.id,
          action: existingPrice ? 'update' : 'create',
          field: 'action',
          oldValue: existingPrice?.action ?? null,
          newValue: action,
          metadata: { carId, date, island },
          ...actor,
        },
        tx,
      );
    }

    return savedPrice;
  });

  revalidatePath('/audit');
  return result;
};

export const updateCarDailyMultipliersAction = async (
  carId: string,
  dailyMultipliers: Record<string, number>,
) => {
  return await db.car.update({
    where: { id: carId },
    data: {
      dailyMultiplier: dailyMultipliers,
    },
  });
};
