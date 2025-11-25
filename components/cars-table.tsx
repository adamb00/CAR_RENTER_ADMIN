'use client';

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
import { useEffect, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import {
  CAR_BODY_TYPE_LABELS,
  CAR_COLOR_LABELS,
  CAR_FUEL_LABELS,
  CAR_TRANSMISSION_LABELS,
} from '@/lib/car-options';
import { cn } from '@/lib/utils';

type CarListEntry = {
  id: string;
  manufacturer: string;
  model: string;
  seats: number;
  smallLuggage: number;
  largeLuggage: number;
  bodyType: string;
  fuel: string;
  transmission: string;
  monthlyPrices: number[];
  colors: string[];
};

type CarWithComputed = CarListEntry;

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
    accessorKey: 'seats',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Férőhely
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) => `${getValue<number>()} fő`,
  },
  {
    accessorKey: 'smallLuggage',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Kis bőrönd
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) => `${getValue<number>()} db`,
  },
  {
    accessorKey: 'largeLuggage',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Nagy bőrönd
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) => `${getValue<number>()} db`,
  },
  {
    accessorKey: 'bodyType',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Kivitel
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) =>
      CAR_BODY_TYPE_LABELS[
        getValue<string>() as keyof typeof CAR_BODY_TYPE_LABELS
      ] ?? getValue<string>(),
  },
  {
    accessorKey: 'fuel',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Üzemanyag
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) =>
      CAR_FUEL_LABELS[getValue<string>() as keyof typeof CAR_FUEL_LABELS] ??
      getValue<string>(),
  },
  {
    accessorKey: 'transmission',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Váltó
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) =>
      CAR_TRANSMISSION_LABELS[
        getValue<string>() as keyof typeof CAR_TRANSMISSION_LABELS
      ] ?? getValue<string>(),
  },
  {
    accessorKey: 'monthlyPrices',
    header: 'Aktuális havi ár',
    enableSorting: false,
    cell: ({ getValue }) => {
      const prices = getValue<number[]>() ?? [];
      const monthIndex = new Date().getMonth(); // 0-11
      const currentPrice = prices[monthIndex];
      return currentPrice != null
        ? `${currentPrice.toLocaleString()} EUR`
        : '—';
    },
  },
];

export function CarsTable({ data }: { data: CarListEntry[] }) {
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return augmentedData.filter((car) => {
      const colorText = (car.colors ?? [])
        .map(
          (color) =>
            CAR_COLOR_LABELS[color as keyof typeof CAR_COLOR_LABELS] ?? color
        )
        .join(' ')
        .toLowerCase();

      const priceText = (car.monthlyPrices ?? [])
        .map((price) => (price ?? '').toString())
        .join(' ');

      const matchesSearch =
        normalizedSearch.length === 0 ||
        [car.manufacturer, car.model, colorText, priceText]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesSearch;
    });
  }, [augmentedData, searchTerm]);

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
  }, [searchTerm]);

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div className='w-full md:w-1/3 lg:w-1/4'>
          <Input
            label='Keresés'
            placeholder='Keresés gyártó vagy típus alapján'
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
                router.push(`/cars/${encodeURIComponent(row.original.id)}/edit`)
              }
              className={cn(
                'group cursor-pointer transition-all duration-200 border-b border-border/70 hover:bg-primary/20 hover:shadow-sm'
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
