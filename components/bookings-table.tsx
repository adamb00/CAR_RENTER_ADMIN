'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

import type { Booking } from '@/data-service/bookings';
import { getStatusMeta } from '@/lib/status';

const LOCALE_LABELS: Record<string, string> = {
  hu: 'Magyar',
  en: 'Angol',
  de: 'Német',
  ro: 'Román',
  fr: 'Francia',
  es: 'Spanyol',
  it: 'Olasz',
  sk: 'Szlovák',
  cz: 'Cseh',
  se: 'Svéd',
  no: 'Norvég',
  dk: 'Dán',
  pl: 'Lengyel',
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toLocaleString('hu-HU');
};

const formatLocale = (locale: string | null | undefined) =>
  locale ? LOCALE_LABELS[locale] ?? locale : '—';

const formatPeriod = (booking: Booking) => {
  const start = booking.rentalStart ?? booking.payload?.rentalPeriod?.startDate;
  const end = booking.rentalEnd ?? booking.payload?.rentalPeriod?.endDate;
  return start || end ? `${start ?? '—'} → ${end ?? '—'}` : '—';
};

export function BookingsTable({ data }: { data: Booking[] }) {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const router = useRouter();

  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      {
        header: 'Foglaló',
        cell: ({ row }) => (
          <div className='flex flex-col gap-1'>
            <div className='text-base font-semibold text-foreground'>
              {row.original.contactName || '—'}
            </div>
            <div className='text-base font-semibold text-foreground'>
              {row.original.humanId || '—'}
            </div>
            <div className='text-sm text-muted-foreground'>
              {row.original.contactEmail || '—'}
            </div>
            <div className='text-xs text-muted-foreground'>
              {row.original.contactPhone || '—'}
            </div>
          </div>
        ),
      },
      {
        header: 'Időszak',
        cell: ({ row }) => (
          <div className='whitespace-nowrap text-muted-foreground'>
            {formatPeriod(row.original)}
          </div>
        ),
      },
      {
        header: 'Autó',
        cell: ({ row }) => (
          <div className='text-muted-foreground'>
            {row.original.carLabel ||
              row.original.carId ||
              row.original.payload?.carId ||
              row.original.quoteId ||
              '—'}
          </div>
        ),
      },
      {
        header: 'Állapot',
        cell: ({ row }) => (
          <div className='text-muted-foreground'>
            {(() => {
              const meta = getStatusMeta(row.original.status);
              return (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${meta.badge}`}
                >
                  {meta.label}
                </span>
              );
            })()}
          </div>
        ),
      },
      {
        header: 'Nyelv',
        cell: ({ row }) => (
          <div className='text-muted-foreground'>
            {formatLocale(row.original.locale)}
          </div>
        ),
      },
      {
        header: 'Beérkezett',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <div className='whitespace-nowrap text-muted-foreground'>
            {formatDate(row.original.createdAt)}
          </div>
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;

    return data.filter((booking) => {
      const driver = booking.payload?.driver?.[0];
      const delivery = booking.payload?.delivery;
      const haystack = [
        booking.contactName,
        booking.contactEmail,
        booking.contactPhone,
        booking.carId,
        booking.status,
        booking.quoteId,
        driver?.email,
        driver?.phoneNumber,
        delivery?.arrivalFlight,
        delivery?.departureFlight,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [data, search]);

  useEffect(() => {
    setPageIndex(0);
  }, [search, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  useEffect(() => {
    if (pageIndex !== safePageIndex) setPageIndex(safePageIndex);
  }, [pageIndex, safePageIndex]);

  const paginatedData = useMemo(() => {
    const start = safePageIndex * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pageSize, safePageIndex]);

  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className='overflow-hidden rounded-xl border bg-card shadow-sm'>
      <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <input
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Keresés név, email, telefon, autó alapján...'
          className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-80'
        />
        <div className='flex items-center gap-3 text-sm text-muted-foreground'>
          <label htmlFor='booking-page-size'>Oldalanként:</label>
          <select
            id='booking-page-size'
            className='rounded-md border border-input bg-background px-2 py-1 text-sm'
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) || 10)}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table className='w-full table-auto text-sm'>
        <thead className='bg-muted/60 text-muted-foreground'>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className='px-4 py-3 text-left font-semibold'
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className='px-4 py-6 text-center text-muted-foreground'
              >
                Nincs találat a jelenlegi szűrőkkel.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() =>
                  router.push(`/${encodeURIComponent(row.original.id)}`)
                }
                className='cursor-pointer border-t transition-colors hover:bg-primary/5'
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className='px-4 py-3 align-top'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className='flex flex-col gap-3 border-t bg-muted/40 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
        <span>
          {filteredData.length === 0
            ? 'Nincs találat'
            : `Találatok: ${filteredData.length} • Oldal ${
                safePageIndex + 1
              } / ${totalPages}`}
        </span>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={safePageIndex === 0}
            className='rounded-md border px-3 py-1 disabled:opacity-50'
          >
            Előző
          </button>
          <button
            type='button'
            onClick={() =>
              setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))
            }
            disabled={safePageIndex >= totalPages - 1}
            className='rounded-md border px-3 py-1 disabled:opacity-50'
          >
            Következő
          </button>
        </div>
      </div>
    </div>
  );
}
