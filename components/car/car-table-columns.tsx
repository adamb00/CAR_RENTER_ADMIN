import { ColumnDef } from '@tanstack/react-table';
import { SortIndicator } from '../ui/sort-indicator';
import { CarWithComputed } from './types';
import {
  CAR_BODY_TYPE_LABELS,
  CAR_FUEL_LABELS,
  CAR_TRANSMISSION_LABELS,
} from '@/lib/car-options';

export const buildColumns = (): ColumnDef<CarWithComputed>[] => [
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
