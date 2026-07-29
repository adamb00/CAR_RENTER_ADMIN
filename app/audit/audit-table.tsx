'use client';

import { Fragment, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { restoreAuditAction } from './action';

export type AuditTableRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  field: string | null;
  oldValue: unknown;
  newValue: unknown;
  metadata: unknown;
  actorName: string | null;
  createdAt: string;
  carLabel: string | null;
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Létrehozás',
  update: 'Módosítás',
  restore: 'Visszaállítás',
};

const INSURANCE_FIELD_LABELS: Record<string, string> = {
  baseInsurance: 'Alap biztosítási díj',
  dailyInsurancePrices: 'Napi biztosítási díjak',
  underAgeLimit: 'Alsó korhatár',
  overAgeLimit: 'Felső korhatár',
  underAgeMultiplier: 'Alsó korhatár szorzó',
  overAgeMultiplier: 'Felső korhatár szorzó',
  settings: 'Biztosítási beállítások',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const getMetadata = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatDateOnly = (value: unknown) => {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const parsed = new Date(value);

  if (!Number.isFinite(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
};

const getEntityLabel = (entityType: string) => {
  if (entityType === 'CarPrices') return 'Autó napi ár';
  if (entityType === 'Insurance') return 'Biztosítás';
  return entityType;
};

const getFieldLabel = (field: string | null) => {
  if (!field) return '-';
  if (field === 'price') return 'Ár';
  if (field === 'action') return 'Action flag';

  if (field.startsWith('dailyInsurancePrices.')) {
    const day = field.split('.').at(-1);
    return `${day}. napi biztosítási díj`;
  }

  return INSURANCE_FIELD_LABELS[field] ?? field;
};

const getValueLabel = (key: string) => {
  if (/^\d+$/.test(key)) return `${key}. nap`;
  return getFieldLabel(key);
};

function formatValue(value: unknown, field: string | null) {
  if (value === null || value === undefined) return 'Nincs érték';

  if (typeof value === 'boolean') return value ? 'Igen' : 'Nem';

  if (typeof value === 'number') {
    const isPriceField =
      field === 'price' ||
      field === 'baseInsurance' ||
      field?.startsWith('dailyInsurancePrices.');

    return isPriceField ? `${value} EUR` : String(value);
  }

  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    if (value.length === 0) return 'Nincs adat';

    return (
      <div className='grid gap-2'>
        {value.map((item, index) => (
          <div key={index} className='rounded-md border bg-muted/20 p-2'>
            {formatValue(item, field)}
          </div>
        ))}
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).filter(
      ([, entryValue]) =>
        entryValue !== undefined && entryValue !== null && entryValue !== '',
    );

    if (entries.length === 0) return 'Nincs adat';

    return (
      <dl className='grid gap-1.5'>
        {entries.map(([key, entryValue]) => (
          <div
            key={key}
            className='grid gap-1 rounded-md border bg-muted/20 p-2 sm:grid-cols-[150px_1fr]'
          >
            <dt className='text-xs font-medium text-muted-foreground'>
              {getValueLabel(key)}
            </dt>
            <dd className='min-w-0 break-words'>
              {formatValue(entryValue, key)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return String(value);
}

const getTargetLabel = (row: AuditTableRow) => {
  const metadata = getMetadata(row.metadata);

  if (row.entityType === 'CarPrices') {
    const parts = [
      row.carLabel ?? 'Autó',
      typeof metadata.island === 'string' ? metadata.island : null,
      formatDateOnly(metadata.date),
    ].filter(Boolean);

    return parts.join(' • ');
  }

  if (row.entityType === 'Insurance') return 'Biztosítási díjak';

  return row.entityId;
};

const canRestore = (row: AuditTableRow) =>
  row.action === 'update' && row.field && row.oldValue !== null;

export function AuditTable({ rows }: { rows: AuditTableRow[] }) {
  const [openRows, setOpenRows] = useState<Set<string>>(() => new Set());

  const toggleRow = (id: string) => {
    setOpenRows((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className='overflow-hidden rounded-md border bg-background'>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[900px] text-sm'>
          <thead className='border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground'>
            <tr>
              <th className='w-12 px-4 py-3 font-medium' aria-label='Részletek' />
              <th className='px-4 py-3 font-medium'>Időpont</th>
              <th className='px-4 py-3 font-medium'>Típus</th>
              <th className='px-4 py-3 font-medium'>Elem</th>
              <th className='px-4 py-3 font-medium'>Mező</th>
              <th className='px-4 py-3 font-medium'>Művelet</th>
              <th className='px-4 py-3 font-medium'>Felhasználó</th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {rows.length === 0 ? (
              <tr>
                <td
                  className='px-4 py-8 text-center text-muted-foreground'
                  colSpan={7}
                >
                  Nincs audit bejegyzés.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isOpen = openRows.has(row.id);

                return (
                  <Fragment key={row.id}>
                    <tr
                      className='cursor-pointer align-top hover:bg-muted/30'
                      onClick={() => toggleRow(row.id)}
                    >
                      <td className='px-4 py-3'>
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          className='size-7'
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleRow(row.id);
                          }}
                          aria-label={isOpen ? 'Részletek bezárása' : 'Részletek megnyitása'}
                        >
                          {isOpen ? (
                            <ChevronDownIcon className='size-4' />
                          ) : (
                            <ChevronRightIcon className='size-4' />
                          )}
                        </Button>
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {getEntityLabel(row.entityType)}
                      </td>
                      <td className='max-w-[320px] px-4 py-3'>
                        {getTargetLabel(row)}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {getFieldLabel(row.field)}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {ACTION_LABELS[row.action] ?? row.action}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {row.actorName ?? '-'}
                      </td>
                    </tr>

                    {isOpen ? (
                      <tr className='bg-muted/20'>
                        <td colSpan={7} className='px-4 pb-5 pt-1'>
                          <div className='ml-11 grid gap-4 rounded-md border bg-background p-4 md:grid-cols-2'>
                            <div className='space-y-2'>
                              <p className='text-xs font-medium uppercase text-muted-foreground'>
                                Régi érték
                              </p>
                              <div className='rounded-md border p-3'>
                                {formatValue(row.oldValue, row.field)}
                              </div>
                            </div>
                            <div className='space-y-2'>
                              <p className='text-xs font-medium uppercase text-muted-foreground'>
                                Új érték
                              </p>
                              <div className='rounded-md border p-3 font-medium'>
                                {formatValue(row.newValue, row.field)}
                              </div>
                            </div>
                            {canRestore(row) ? (
                              <div className='md:col-span-2'>
                                <form action={restoreAuditAction}>
                                  <input name='auditId' type='hidden' value={row.id} />
                                  <Button size='sm' variant='outline' type='submit'>
                                    Visszaállítás
                                  </Button>
                                </form>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
