'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';

const HANDOVER_DIRECTIONS = ['out', 'in'] as const;
const HANDOVER_COST_TYPES = [
  'tip',
  'fuel',
  'ferry',
  'cleaning',
  'commission',
] as const;

type HandoverDirectionValue = (typeof HANDOVER_DIRECTIONS)[number];
type HandoverCostTypeValue = (typeof HANDOVER_COST_TYPES)[number];

type CreateBookingHandoverCostInput = {
  bookingId?: string;
  direction?: string;
  costType?: string;
  amount?: string;
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

export const createBookingHandoverCostAction = async (
  input: CreateBookingHandoverCostInput,
) => {
  const bookingId = toOptionalString(input.bookingId);
  const direction = toOptionalString(input.direction);
  const costType = toOptionalString(input.costType);
  const amount = parseAmount(input.amount);
  const normalizedDirection = direction
    ? HANDOVER_DIRECTIONS.includes(direction as HandoverDirectionValue)
      ? (direction as HandoverDirectionValue)
      : null
    : null;

  if (!bookingId) {
    return { error: 'A foglalás kiválasztása kötelező.' };
  }

  if (direction && !normalizedDirection) {
    return { error: 'Az irány érvénytelen.' };
  }

  if (
    !costType ||
    !HANDOVER_COST_TYPES.includes(costType as HandoverCostTypeValue)
  ) {
    return { error: 'A költségtípus érvénytelen.' };
  }

  if (input.amount?.trim() && amount == null) {
    return { error: 'Az összeg érvénytelen.' };
  }

  if (amount == null) {
    return { error: 'Az összeg megadása kötelező.' };
  }

  const booking = await db.rentRequests.findUnique({
    where: { id: bookingId },
    select: { id: true },
  });

  if (!booking) {
    return { error: 'A kiválasztott foglalás nem található.' };
  }

  try {
    await db.$executeRaw`
      INSERT INTO "BookingHandoverCosts" (
        "bookingId",
        "direction",
        "costType",
        "amount"
      )
      VALUES (
        ${bookingId}::uuid,
        ${normalizedDirection}::"HandoverDirection",
        CAST(${costType} AS "HandoverCostType"),
        ${amount}
      )
    `;

    revalidatePath('/costs');
    revalidatePath('/analitycs');
    revalidatePath(`/${bookingId}`);
    revalidatePath(`/bookings/${bookingId}/edit`);
    revalidatePath(`/bookings/${bookingId}/carout`);
    revalidatePath(`/bookings/${bookingId}/carin`);

    return { success: 'A handover cost elmentve.' };
  } catch (error) {
    console.error('createBookingHandoverCostAction', error);
    return { error: 'A handover cost mentése nem sikerült.' };
  }
};
