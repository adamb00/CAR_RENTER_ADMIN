'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import type { ContactQuote } from '@/data-service/quotes';
import { getStatusMeta } from '@/lib/status';
import { cn } from '@/lib/utils';

type QuoteRow = ContactQuote;

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('hu-HU');
};

const formatPeriod = (quote: QuoteRow) => {
  if (quote.rentalStart || quote.rentalEnd) {
    return `${quote.rentalStart ?? '—'} → ${quote.rentalEnd ?? '—'}`;
  }
  return '—';
};

type QuotesTableProps = {
  data: QuoteRow[];
};

export default function QuotesTable({ data }: QuotesTableProps) {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const columns = useMemo<ColumnDef<QuoteRow>[]>(
    () => [
      {
        header: 'Név',
        accessorKey: 'name',
        cell: ({ row }) => (
          <Link
            href={`/quotes/${row.original.id}`}
            className='block'
            prefetch={false}
          >
            <div className='flex flex-col'>
              <div className='text-lg font-semibold text-foreground'>
                {row.original.name || '—'}
              </div>
              <div className='text-sm font-semibold text-foreground/80'>
                {row.original.humanId}
              </div>
            </div>
          </Link>
        ),
      },
      {
        header: 'Elérhetőség',
        cell: ({ row }) => (
          <Link
            href={`/quotes/${row.original.id}`}
            className='block'
            prefetch={false}
          >
            <div className='text-foreground'>{row.original.email || '—'}</div>
            <div className='text-muted-foreground'>
              {row.original.phone || '—'}
            </div>
          </Link>
        ),
      },
      {
        header: 'Időszak',
        cell: ({ row }) => (
          <Link
            href={`/quotes/${row.original.id}`}
            className='block whitespace-nowrap text-muted-foreground'
            prefetch={false}
          >
            {formatPeriod(row.original)}
          </Link>
        ),
      },
      {
        header: 'Állapot',
        cell: ({ row }) => (
          <Link
            href={`/quotes/${row.original.id}`}
            className='block text-muted-foreground'
            prefetch={false}
          >
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
          </Link>
        ),
      },
      {
        header: 'Autó',
        cell: ({ row }) => (
          <Link
            href={`/quotes/${row.original.id}`}
            className='block text-muted-foreground'
            prefetch={false}
          >
            {row.original.carName
              ? row.original.carName
              : row.original.carId
              ? `#${row.original.carId}`
              : '—'}
          </Link>
        ),
      },
      {
        header: 'Beérkezett',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <Link
            href={`/quotes/${row.original.id}`}
            className='block whitespace-nowrap text-muted-foreground'
            prefetch={false}
          >
            {formatDate(row.original.createdAt)}
          </Link>
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter((q) => {
      const haystack = [
        q.name,
        q.email,
        q.phone,
        q.carName,
        q.carId,
        q.arrivalFlight,
        q.departureFlight,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePageIndex]);

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
          <label htmlFor='page-size'>Oldalanként:</label>
          <select
            id='page-size'
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
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn('border-t transition-colors hover:bg-primary/10')}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className='px-4 py-3 align-top'>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
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
