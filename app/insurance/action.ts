'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { areAuditValuesEqual, getAuditActor, recordAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import {
  InsuranceFormSchema,
  type InsuranceFormSchemaType,
} from '@/schemas/insuranceSchema';

type UpdateInsuranceActionResult = {
  success?: string;
  error?: string;
};

type InsuranceAuditChange = {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  metadata?: Record<string, unknown>;
};

const normalizeInsurancePriceMap = (
  value: Prisma.JsonValue | Record<string, number>,
) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const buildInsuranceAuditChanges = (
  existing: {
    underAgeLimit: number;
    overAgeLimit: number;
    underAgeMultiplier: number;
    overAgeMultiplier: number;
    dailyInsurancePrices: Prisma.JsonValue;
  },
  nextData: {
    underAgeLimit: number;
    overAgeLimit: number;
    underAgeMultiplier: number;
    overAgeMultiplier: number;
    dailyInsurancePrices: Record<string, number>;
  },
) => {
  const changes: InsuranceAuditChange[] = [];
  const scalarFields = [
    'underAgeLimit',
    'overAgeLimit',
    'underAgeMultiplier',
    'overAgeMultiplier',
  ] as const;

  for (const field of scalarFields) {
    if (!areAuditValuesEqual(existing[field], nextData[field])) {
      changes.push({
        field,
        oldValue: existing[field],
        newValue: nextData[field],
      });
    }
  }

  const previousPrices = normalizeInsurancePriceMap(
    existing.dailyInsurancePrices,
  );
  const nextPrices = normalizeInsurancePriceMap(nextData.dailyInsurancePrices);
  const dayKeys = Array.from(
    new Set([...Object.keys(previousPrices), ...Object.keys(nextPrices)]),
  ).sort((left, right) => Number(left) - Number(right));

  for (const day of dayKeys) {
    const oldValue = previousPrices[day] ?? null;
    const newValue = nextPrices[day] ?? null;

    if (!areAuditValuesEqual(oldValue, newValue)) {
      changes.push({
        field: `dailyInsurancePrices.${day}`,
        oldValue,
        newValue,
        metadata: { day: Number(day) },
      });
    }
  }

  return changes;
};

export const updateInsuranceAction = async (
  values: InsuranceFormSchemaType,
): Promise<UpdateInsuranceActionResult> => {
  const validated = await InsuranceFormSchema.safeParseAsync(values);

  if (!validated.success) {
    return { error: 'Hibás adatok. Kérjük próbáld meg újból!' };
  }

  const {
    underAgeLimit,
    overAgeLimit,
    underAgeMultiplier,
    overAgeMultiplier,
    dailyInsurancePrices,
  } = validated.data;

  const data = {
    underAgeLimit,
    overAgeLimit,
    underAgeMultiplier,
    overAgeMultiplier,
    dailyInsurancePrices: dailyInsurancePrices as Prisma.InputJsonValue,
  };

  try {
    const actor = await getAuditActor();
    const existingInsurance = await db.insurance.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        underAgeLimit: true,
        overAgeLimit: true,
        underAgeMultiplier: true,
        overAgeMultiplier: true,
        dailyInsurancePrices: true,
      },
    });

    await db.$transaction(async (tx) => {
      if (existingInsurance) {
        await tx.insurance.update({
          where: { id: existingInsurance.id },
          data,
        });

        const changes = buildInsuranceAuditChanges(existingInsurance, {
          underAgeLimit,
          overAgeLimit,
          underAgeMultiplier,
          overAgeMultiplier,
          dailyInsurancePrices,
        });

        for (const change of changes) {
          await recordAudit(
            {
              entityType: 'Insurance',
              entityId: existingInsurance.id,
              action: 'update',
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              metadata: change.metadata ?? {
                insuranceId: existingInsurance.id,
              },
              ...actor,
            },
            tx,
          );
        }

        return;
      }

      const createdInsurance = await tx.insurance.create({
        data,
      });

      await recordAudit(
        {
          entityType: 'Insurance',
          entityId: createdInsurance.id,
          action: 'create',
          field: 'settings',
          oldValue: null,
          newValue: {
            underAgeLimit,
            overAgeLimit,
            underAgeMultiplier,
            overAgeMultiplier,
            dailyInsurancePrices,
          },
          metadata: { insuranceId: createdInsurance.id },
          ...actor,
        },
        tx,
      );
    });

    revalidatePath('/audit');
    revalidatePath('/insurance');
    return { success: 'A biztosítási díjak elmentve.' };
  } catch (error) {
    console.error('updateInsuranceAction', error);
    return {
      error:
        'Nem sikerült elmenteni a biztosítási díjakat. Próbáld meg később.',
    };
  }
};

export const updateIncuranceAction = updateInsuranceAction;
