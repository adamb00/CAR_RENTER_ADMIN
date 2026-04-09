'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import {
  DEFAULT_HANDOVER_COST_TYPES,
  HandoverCostTypeCategory,
  toHandoverCostTypeSlug,
} from '@/lib/handover-cost-types';

type CreateHandoverCostTypeInput = {
  label?: string;
  category?: string;
};

const toOptionalString = (value?: string | null) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isValidCategory = (
  value: string | null,
): value is HandoverCostTypeCategory =>
  value === 'expense' || value === 'deduction';

export const createHandoverCostTypeAction = async (
  input: CreateHandoverCostTypeInput,
) => {
  const label = toOptionalString(input.label);
  const category = toOptionalString(input.category);

  if (!label) {
    return { error: 'A költségtípus neve kötelező.' };
  }

  if (!isValidCategory(category)) {
    return { error: 'A költségtípus kategóriája érvénytelen.' };
  }

  const slug = toHandoverCostTypeSlug(label);

  if (!slug) {
    return { error: 'A megadott névből nem képződött érvényes azonosító.' };
  }

  const [existingBySlug, existingByLabel, lastType] = await Promise.all([
    db.handoverCustomCostType.findUnique({
      where: { slug },
      select: { id: true },
    }),
    db.handoverCustomCostType.findFirst({
      where: {
        label: {
          equals: label,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    }),
    db.handoverCustomCostType.findFirst({
      orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
      select: { sortOrder: true },
    }),
  ]);

  const isReservedDefault =
    DEFAULT_HANDOVER_COST_TYPES.some((item) => item.slug === slug) ||
    DEFAULT_HANDOVER_COST_TYPES.some(
      (item) => item.label.toLowerCase() === label.toLowerCase(),
    );

  if (existingBySlug || existingByLabel || isReservedDefault) {
    return { error: 'Ez a költségtípus már létezik.' };
  }

  try {
    await db.handoverCustomCostType.create({
      data: {
        slug,
        label,
        category,
        sortOrder: (lastType?.sortOrder ?? 0) + 10,
      },
    });

    revalidatePath('/costs');

    return { success: 'Az új költségtípus elmentve.' };
  } catch (error) {
    console.error('createHandoverCostTypeAction', error);
    return { error: 'A költségtípus mentése nem sikerült.' };
  }
};
