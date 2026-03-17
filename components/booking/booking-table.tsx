'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { Booking } from '@/data-service/bookings';
import { BookingTableColumns } from './booking-table-columns';

export function BookingsTable({ data }: { data: Booking[] }) {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const router = useRouter();

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;

    return data.filter((booking) => {
      const driver = booking.payload?.driver?.[0];
      const delivery = booking.delivery;
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
    columns: BookingTableColumns,
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
                        header.getContext(),
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
                colSpan={BookingTableColumns.length}
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
