import { auth } from '@/auth';
import { db } from '@/lib/db';

type AuditAction = 'create' | 'update' | 'restore';

type AuditInput = {
  entityType: 'CarPrices' | 'Insurance';
  entityId: string;
  action: AuditAction;
  field?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown> | null;
};

type AuditDatabase = {
  $executeRaw: typeof db.$executeRaw;
};

const normalizeJsonValue = (value: unknown) => {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
};

export const areAuditValuesEqual = (left: unknown, right: unknown) =>
  JSON.stringify(left ?? null) === JSON.stringify(right ?? null);

export const getAuditActor = async () => {
  const session = await auth();

  return {
    actorId: session?.user?.id ?? null,
    actorName:
      session?.user?.name?.trim() ||
      session?.user?.email?.trim() ||
      null,
  };
};

export const recordAudit = async (
  input: AuditInput & { actorId?: string | null; actorName?: string | null },
  database: AuditDatabase = db,
) => {
  await database.$executeRaw`
    INSERT INTO "Audit" (
      "entityType",
      "entityId",
      "action",
      "field",
      "oldValue",
      "newValue",
      "metadata",
      "actorId",
      "actorName"
    )
    VALUES (
      ${input.entityType},
      ${input.entityId},
      ${input.action},
      ${input.field ?? null},
      ${normalizeJsonValue(input.oldValue)}::jsonb,
      ${normalizeJsonValue(input.newValue)}::jsonb,
      ${normalizeJsonValue(input.metadata)}::jsonb,
      ${input.actorId ?? null},
      ${input.actorName ?? null}
    )
  `;
};
