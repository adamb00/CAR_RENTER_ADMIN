'use server';

import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

import { db } from '@/lib/db';
import { vehicleHandoverSchema } from '@/lib/vehicle-handover-schema';

export async function createVehicleHandoverAction(
  input: z.infer<typeof vehicleHandoverSchema>,
) {
  const parsed = vehicleHandoverSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Érvénytelen adatok, kérjük ellenőrizd a mezőket.' };
  }

  const data = parsed.data;
  const direction = data.direction ?? 'out';

  if (direction === 'in' && data.mileage == null) {
    return { error: 'A km óra állás kötelező visszavételnél.' };
  }

  const booking = await db.rentRequests.findUnique({
    where: { id: data.bookingId },
    select: { id: true },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  if (direction === 'out') {
    const signedContract = await db.bookingContract.findUnique({
      where: { bookingId: data.bookingId },
      select: {
        id: true,
        signedAt: true,
        signatureData: true,
        lessorSignatureData: true,
      },
    });

    const hasValidContract = Boolean(
      signedContract?.id &&
        signedContract.signedAt &&
        signedContract.signatureData &&
        signedContract.lessorSignatureData,
    );

    if (!hasValidContract) {
      return {
        error:
          'A kiadás előtt kötelező a bérleti szerződés aláírása. Előbb nyisd meg a Digitális szerződés oldalt.',
      };
    }
  }

  const fleetVehicle = await db.fleetVehicle.findUnique({
    where: { id: data.fleetVehicleId },
    select: { id: true },
  });

  if (!fleetVehicle) {
    return { error: 'A flottajármű nem található.' };
  }

  if (direction === 'in' && data.mileage != null) {
    const handoverOut = await db.vehicleHandover.findFirst({
      where: {
        bookingId: data.bookingId,
        fleetVehicleId: data.fleetVehicleId,
        direction: 'out',
      },
      orderBy: { handoverAt: 'desc' },
      select: { mileage: true },
    });
    const outMileage = handoverOut?.mileage;
    if (outMileage != null && data.mileage < outMileage) {
      return {
        error: `A km óra állás nem lehet kisebb, mint a kiadáskori érték (${outMileage} km).`,
      };
    }
  }

  const handoverAt = data.handoverAt ? new Date(data.handoverAt) : new Date();

  const shouldUpdateOdometer = direction === 'in' && data.mileage != null;
  const locationValue = data.location?.trim();
  const shouldUpdateLocation = Boolean(locationValue);
  const costUpdates: Array<{
    direction: 'out' | 'in';
    costType: 'tip' | 'fuel' | 'ferry' | 'cleaning';
    amount: number;
  }> = [
    ...(direction === 'out' && data.tip != null
      ? [{ direction: 'out' as const, costType: 'tip' as const, amount: data.tip }]
      : []),
    ...(data.fuelCost != null
      ? [{ direction: direction as 'out' | 'in', costType: 'fuel' as const, amount: data.fuelCost }]
      : []),
    ...(data.ferryCost != null
      ? [{ direction: direction as 'out' | 'in', costType: 'ferry' as const, amount: data.ferryCost }]
      : []),
    ...(data.cleaningCost != null
      ? [{ direction: direction as 'out' | 'in', costType: 'cleaning' as const, amount: data.cleaningCost }]
      : []),
  ];

  try {
    const created = await db.$transaction(async (tx) => {
      const createdRow = await tx.vehicleHandover.create({
        data: {
          bookingId: data.bookingId,
          fleetVehicleId: data.fleetVehicleId,
          direction,
          handoverAt,
          handoverBy: data.handoverBy?.trim() || null,
          mileage: data.mileage,
          notes: data.notes?.trim() || null,
          damages: data.damages?.trim() || null,
          damagesImages: data.damagesImages ?? [],
        },
        select: { id: true },
      });

      if (shouldUpdateOdometer || shouldUpdateLocation) {
        await tx.fleetVehicle.update({
          where: { id: data.fleetVehicleId },
          data: {
            ...(shouldUpdateOdometer ? { odometer: data.mileage ?? 0 } : {}),
            ...(shouldUpdateLocation ? { location: locationValue } : {}),
          },
        });
      }

      await tx.rentRequests.update({
        where: { id: data.bookingId },
        data: { updatedAt: new Date() },
      });

      for (const cost of costUpdates) {
        await tx.$executeRaw`
          INSERT INTO "BookingHandoverCosts" (
            "bookingId",
            "direction",
            "costType",
            "amount",
            "updatedAt"
          )
          VALUES (
            ${data.bookingId}::uuid,
            CAST(${cost.direction} AS "HandoverDirection"),
            CAST(${cost.costType} AS "HandoverCostType"),
            ${cost.amount},
            timezone('utc'::text, now())
          )
          ON CONFLICT ("bookingId", "direction", "costType")
          DO UPDATE SET
            "amount" = EXCLUDED."amount",
            "updatedAt" = timezone('utc'::text, now())
        `;
      }

      return createdRow;
    });

    revalidatePath('/bookings');
    revalidatePath('/calendar');
    revalidatePath(`/bookings/${data.bookingId}/carout`);
    revalidatePath(`/bookings/${data.bookingId}/carin`);
    revalidatePath('/analitycs');

    return {
      success: direction === 'in' ? 'Visszavétel rögzítve.' : 'Kiadás rögzítve.',
      id: created.id,
    };
  } catch (error) {
    console.error('Failed to create vehicle handover', error);
    return { error: 'Nem sikerült elmenteni a kiadást.' };
  }
}
