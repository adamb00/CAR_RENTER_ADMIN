'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { isDefaultHandoverCostTypeSlug } from '@/lib/handover-cost-types';

const HANDOVER_DIRECTIONS = ['out', 'in'] as const;

type HandoverDirectionValue = (typeof HANDOVER_DIRECTIONS)[number];

type CreateBookingHandoverCostInput = {
  bookingId?: string;
  direction?: string;
  costType?: string;
  amount?: string;
  createdAt?: string;
};

const toOptionalString = (value?: string | null) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseAmount = (value?: string) => {
  const normalized = toOptionalString(value);
  if (!normalized) return null;

  const parsed = Number(normalized.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Number(parsed.toFixed(2));
};

const parseCostDate = (value?: string | null) => {
  const normalized = toOptionalString(value);
  if (!normalized) return null;

  const parsed = new Date(`${normalized}T12:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  return parsed;
};

export const createBookingHandoverCostAction = async (
  input: CreateBookingHandoverCostInput,
) => {
  const bookingId = toOptionalString(input.bookingId);
  const direction = toOptionalString(input.direction);
  const costType = toOptionalString(input.costType);
  const amount = parseAmount(input.amount);
  const costDate = parseCostDate(input.createdAt);
  const normalizedDirection = direction
    ? HANDOVER_DIRECTIONS.includes(direction as HandoverDirectionValue)
      ? (direction as HandoverDirectionValue)
      : null
    : null;

  if (direction && !normalizedDirection) {
    return { error: 'Az irány érvénytelen.' };
  }

  if (!costType) {
    return { error: 'A költségtípus kiválasztása kötelező.' };
  }

  if (input.amount?.trim() && amount == null) {
    return { error: 'Az összeg érvénytelen.' };
  }

  if (amount == null) {
    return { error: 'Az összeg megadása kötelező.' };
  }

  if (costDate === undefined) {
    return { error: 'A dátum érvénytelen.' };
  }

  if (bookingId) {
    const booking = await db.rentRequests.findUnique({
      where: { id: bookingId },
      select: { id: true },
    });

    if (!booking) {
      return { error: 'A kiválasztott foglalás nem található.' };
    }
  }

  const isDefaultType = isDefaultHandoverCostTypeSlug(costType);
  const customCostType = !isDefaultType
    ? await db.handoverCustomCostType.findUnique({
        where: { slug: costType },
        select: { slug: true },
      })
    : null;

  if (!isDefaultType && !customCostType) {
    return { error: 'A kiválasztott költségtípus nem található.' };
  }

  try {
    await db.$transaction(async (tx) => {
      if (bookingId) {
        await tx.$executeRaw`
          DELETE FROM "BookingHandoverCosts"
          WHERE "bookingId" = ${bookingId}::uuid
            AND "direction" IS NOT DISTINCT FROM ${normalizedDirection}::"HandoverDirection"
            AND "costType" = CAST(${isDefaultType ? costType : 'custom'} AS "HandoverCostType")
            AND "customCostTypeSlug" IS NOT DISTINCT FROM ${isDefaultType ? null : costType}::varchar(64)
        `;
      }

      await tx.$executeRaw`
        INSERT INTO "BookingHandoverCosts" (
          "bookingId",
          "direction",
          "costType",
          "customCostTypeSlug",
          "amount",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${bookingId}::uuid,
          ${normalizedDirection}::"HandoverDirection",
          CAST(${isDefaultType ? costType : 'custom'} AS "HandoverCostType"),
          ${isDefaultType ? null : costType},
          ${amount},
          COALESCE(${costDate}, timezone('utc'::text, now())),
          COALESCE(${costDate}, timezone('utc'::text, now()))
        )
      `;
    });

    revalidatePath('/costs');
    revalidatePath('/analitycs');
    if (bookingId) {
      revalidatePath(`/${bookingId}`);
      revalidatePath(`/bookings/${bookingId}/edit`);
      revalidatePath(`/bookings/${bookingId}/carout`);
      revalidatePath(`/bookings/${bookingId}/carin`);
    }

    return { success: 'A handover cost elmentve.' };
  } catch (error) {
    console.error('createBookingHandoverCostAction', error);
    return { error: 'A handover cost mentése nem sikerült.' };
  }
};
