'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { getAuditActor, recordAudit } from '@/lib/audit';
import { db } from '@/lib/db';

type AuditRestoreRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  field: string | null;
  oldValue: unknown;
  newValue: unknown;
  metadata: unknown;
};

const getAuditMetadata = (metadata: unknown) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  return metadata as Record<string, unknown>;
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

const normalizeInsurancePrices = (value: Prisma.JsonValue) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...(value as Record<string, unknown>) };
};

export const restoreAuditAction = async (formData: FormData) => {
  const auditId = String(formData.get('auditId') ?? '').trim();

  if (!auditId) {
    return;
  }

  const rows = await db.$queryRaw<AuditRestoreRow[]>`
    SELECT
      "id"::text AS "id",
      "entityType",
      "entityId",
      "action",
      "field",
      "oldValue",
      "newValue",
      "metadata"
    FROM "Audit"
    WHERE "id" = ${auditId}::uuid
    LIMIT 1
  `;
  const audit = rows[0];

  if (!audit || audit.action !== 'update' || !audit.field) {
    return;
  }

  const auditField = audit.field;
  const actor = await getAuditActor();

  if (audit.entityType === 'CarPrices') {
    const carPrice = await db.carPrices.findUnique({
      where: { id: audit.entityId },
      select: {
        id: true,
        carId: true,
        date: true,
        island: true,
        price: true,
        action: true,
      },
    });

    if (!carPrice) {
      return;
    }

    if (auditField === 'price') {
      const restoredPrice = toNumber(audit.oldValue);
      if (restoredPrice == null) {
        return;
      }

      await db.$transaction(async (tx) => {
        await tx.carPrices.update({
          where: { id: carPrice.id },
          data: { price: restoredPrice },
        });
        await recordAudit(
          {
            entityType: 'CarPrices',
            entityId: carPrice.id,
            action: 'restore',
            field: 'price',
            oldValue: carPrice.price,
            newValue: restoredPrice,
            metadata: {
              ...getAuditMetadata(audit.metadata),
              restoredFromAuditId: audit.id,
            },
            ...actor,
          },
          tx,
        );
      });
    } else if (auditField === 'action') {
      const restoredAction = toBoolean(audit.oldValue);
      if (restoredAction == null) {
        return;
      }

      await db.$transaction(async (tx) => {
        await tx.carPrices.update({
          where: { id: carPrice.id },
          data: { action: restoredAction },
        });
        await recordAudit(
          {
            entityType: 'CarPrices',
            entityId: carPrice.id,
            action: 'restore',
            field: auditField,
            oldValue: carPrice.action,
            newValue: restoredAction,
            metadata: {
              ...getAuditMetadata(audit.metadata),
              restoredFromAuditId: audit.id,
            },
            ...actor,
          },
          tx,
        );
      });
    } else {
      return;
    }

    revalidatePath('/audit');
    revalidatePath('/cars');
    revalidatePath(`/cars/${carPrice.carId}/edit`);
    return;
  }

  if (audit.entityType === 'Insurance') {
    const insurance = await db.insurance.findUnique({
      where: { id: audit.entityId },
      select: {
        id: true,
        baseInsurance: true,
        underAgeLimit: true,
        overAgeLimit: true,
        underAgeMultiplier: true,
        overAgeMultiplier: true,
        dailyInsurancePrices: true,
      },
    });

    if (!insurance) {
      return;
    }

    const restoredValue = toNumber(audit.oldValue);
    if (restoredValue == null) {
      return;
    }

    await db.$transaction(async (tx) => {
      let currentValue: unknown = null;

      if (auditField === 'baseInsurance') {
        currentValue = insurance.baseInsurance;
        await tx.insurance.update({
          where: { id: insurance.id },
          data: { baseInsurance: restoredValue },
        });
      } else if (auditField === 'underAgeLimit') {
        currentValue = insurance.underAgeLimit;
        await tx.insurance.update({
          where: { id: insurance.id },
          data: { underAgeLimit: restoredValue },
        });
      } else if (auditField === 'overAgeLimit') {
        currentValue = insurance.overAgeLimit;
        await tx.insurance.update({
          where: { id: insurance.id },
          data: { overAgeLimit: restoredValue },
        });
      } else if (auditField === 'underAgeMultiplier') {
        currentValue = insurance.underAgeMultiplier;
        await tx.insurance.update({
          where: { id: insurance.id },
          data: { underAgeMultiplier: restoredValue },
        });
      } else if (auditField === 'overAgeMultiplier') {
        currentValue = insurance.overAgeMultiplier;
        await tx.insurance.update({
          where: { id: insurance.id },
          data: { overAgeMultiplier: restoredValue },
        });
      } else if (auditField.startsWith('dailyInsurancePrices.')) {
        const day = auditField.split('.').at(-1);
        if (!day) {
          throw new Error('Invalid daily insurance audit field.');
        }

        const prices = normalizeInsurancePrices(insurance.dailyInsurancePrices);
        currentValue = prices[day] ?? null;
        const nextPrices = { ...prices, [day]: restoredValue };

        await tx.insurance.update({
          where: { id: insurance.id },
          data: { dailyInsurancePrices: nextPrices as Prisma.InputJsonValue },
        });
      } else {
        throw new Error('Unsupported insurance audit field.');
      }

      await recordAudit(
        {
          entityType: 'Insurance',
          entityId: insurance.id,
          action: 'restore',
          field: auditField,
          oldValue: currentValue,
          newValue: restoredValue,
          metadata: {
            ...getAuditMetadata(audit.metadata),
            restoredFromAuditId: audit.id,
          },
          ...actor,
        },
        tx,
      );
    });

    revalidatePath('/audit');
    revalidatePath('/insurance');
    return;
  }

  return;
};
