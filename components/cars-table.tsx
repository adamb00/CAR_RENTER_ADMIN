'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { CarStatusOption } from '@/lib/car-options';
import { cn } from '@/lib/utils';

type CarListEntry = {
  manufacturer: string;
  model: string;
  licensePlate: string;
  status: CarStatusOption;
  odometer: number;
};

type CarWithComputed = CarListEntry;

const STATUS_ROW_CLASSES: Record<CarStatusOption, string> = {
  available: 'bg-emerald-100',
  rented: 'bg-blue-100',
  maintenance: 'bg-purple-100',
  inactive: 'bg-rose-100',
  reserved: 'bg-amber-100',
};

const SortIndicator = ({
  direction,
}: {
  direction: false | 'asc' | 'desc';
}) => (
  <span className='text-xs text-muted-foreground'>
    {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : ''}
  </span>
);

const buildColumns = (): ColumnDef<CarWithComputed>[] => [
  {
    accessorKey: 'manufacturer',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Gyártó / Típus
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-semibold text-foreground'>
          {row.original.manufacturer}
        </span>
        <span className='text-sm text-muted-foreground'>
          {row.original.model}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'licensePlate',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Rendszám
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Státusz
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) => (
      <Badge variant='secondary' className='capitalize'>
        {getValue<string>()}
      </Badge>
    ),
  },
  {
    accessorKey: 'odometer',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Km óra
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) => `${getValue<number>().toLocaleString('hu-HU')} km`,
  },
];

export function CarsTable({ data }: { data: CarListEntry[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CarStatusOption>('all');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'manufacturer', desc: false },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const router = useRouter();

  const augmentedData = useMemo<CarWithComputed[]>(() => data, [data]);

  const columns = useMemo(() => buildColumns(), []);

  const availableStatuses = useMemo(
    () => Array.from(new Set(data.map((car) => car.status))),
    [data]
  );

  const filteredData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return augmentedData.filter((car) => {
      const matchesStatus =
        statusFilter === 'all' || car.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [car.manufacturer, car.model, car.licensePlate]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [augmentedData, searchTerm, statusFilter]);

  const table = useReactTable({
    data: filteredData,
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
  }, [searchTerm, statusFilter]);

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div className='w-full md:w-1/3 lg:w-1/4'>
          <Input
            label='Keresés'
            placeholder='Keresés gyártó, típus vagy rendszám alapján'
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className='flex flex-col gap-1 text-sm'>
          <label className='text-xs font-semibold uppercase text-muted-foreground'>
            Státusz
          </label>
          <select
            className='h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600'
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | CarStatusOption)
            }
          >
            <option value='all'>Összes</option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
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
              onClick={() =>
                router.push(
                  `/cars/${encodeURIComponent(row.original.licensePlate)}/edit`
                )
              }
              className={cn(
                'group cursor-pointer transition-all duration-200 border-b border-border/70',
                STATUS_ROW_CLASSES[row.original.status],
                'hover:bg-primary/20 hover:shadow-sm'
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className='px-4 py-4 align-top transition-colors duration-200 group-hover:text-foreground'
                >
                  {flexRender(
                    cell.column.columnDef.cell ?? ((info) => info.getValue()),
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
          {filteredData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className='px-4 py-6 text-center text-muted-foreground'
              >
                Nincs megjeleníthető autó.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className='flex flex-col gap-3 border-t pt-4 text-sm md:flex-row md:items-center md:justify-between'>
        <p className='text-muted-foreground'>
          {filteredData.length === 0
            ? 'Nincs megjeleníthető autó.'
            : `${pagination.pageIndex * pagination.pageSize + 1}–${Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                filteredData.length
              )} / ${filteredData.length} autó`}
        </p>
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
