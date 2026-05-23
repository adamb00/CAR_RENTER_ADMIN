'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Accommodation } from '@prisma/client';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { buildColumns } from './accommodations-table-columns';
import { useRouter } from 'next/navigation';

type AccommodationsTableProps = {
  data: Accommodation[];
};

export default function AccommodationsTable({
  data,
}: AccommodationsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const router = useRouter();

  const columns = useMemo(() => buildColumns(), []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchTerm]);
  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div className='w-full md:w-1/3 lg:w-1/4'>
          <Input
            label='Keresés'
            placeholder='Keresés'
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className='flex flex-col gap-1 text-sm'>
          <label className='text-xs font-semibold uppercase text-muted-foreground'>
            Elem / oldal
          </label>
          <select
            className='h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600'
            value={pagination.pageSize}
            onChange={(event) =>
              setPagination({
                pageIndex: 0,
                pageSize: Number(event.target.value),
              })
            }
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / oldal
              </option>
            ))}
          </select>
        </div>
      </div>

      <table className='w-full table-fixed overflow-hidden rounded-xl border border-separate border-spacing-0 text-sm transition-shadow hover:shadow-lg'>
        <thead className='bg-muted/60 text-muted-foreground'>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide'
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
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() =>
                router.push(
                  `/accommodations/${encodeURIComponent(row.original.id)}`,
                )
              }
              className={cn(
                'group cursor-pointer transition-all duration-200 border-b border-border/70 hover:bg-primary/20 hover:shadow-sm',
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className='px-4 py-4 align-center transition-colors duration-200 group-hover:text-foreground'
                >
                  {flexRender(
                    cell.column.columnDef.cell ?? ((info) => info.getValue()),
                    cell.getContext(),
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className='flex flex-col gap-3 border-t pt-4 text-sm md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            className='rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Előző
          </button>
          <span className='text-xs font-semibold uppercase text-muted-foreground'>
            {pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
          </span>
          <button
            type='button'
            className='rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Következő
          </button>
        </div>
      </div>
    </div>
  );
}
