import { db } from '@/lib/db';

import { AuditTable, type AuditTableRow } from './audit-table';

type AuditPageRow = Omit<AuditTableRow, 'createdAt'> & {
  createdAt: Date;
};

export default async function AuditPage() {
  const rows = await db.$queryRaw<AuditPageRow[]>`
    SELECT
      a."id"::text AS "id",
      a."entityType",
      a."entityId",
      a."action",
      a."field",
      a."oldValue",
      a."newValue",
      a."metadata",
      a."actorName",
      a."createdAt",
      NULLIF(CONCAT_WS(' ', c."manufacturer", c."model"), '') AS "carLabel"
    FROM "Audit" a
    LEFT JOIN "CarPrices" cp
      ON a."entityType" = 'CarPrices'
      AND cp."id" = a."entityId"
    LEFT JOIN "Cars" c
      ON c."id" = COALESCE(cp."carId", a."metadata"->>'carId')
    WHERE a."entityType" IN ('CarPrices', 'Insurance')
    ORDER BY a."createdAt" DESC, a."id" DESC
  `;

  const tableRows = rows.map<AuditTableRow>((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Audit log</h1>
        <p className='text-sm text-muted-foreground'>
          Autóárak és biztosítási díjak módosításai.
        </p>
      </div>

      <AuditTable rows={tableRows} />
    </div>
  );
}
