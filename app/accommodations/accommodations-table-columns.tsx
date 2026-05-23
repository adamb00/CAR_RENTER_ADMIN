import { SortIndicator } from '@/components/ui/sort-indicator';
import { Accommodation } from '@prisma/client';
import { ColumnDef } from '@tanstack/react-table';

export const buildColumns = (): ColumnDef<Accommodation>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Szállás neve
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-semibold text-foreground'>
          {row.original.name}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Szálláshoz tartozó email
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-semibold text-foreground'>
          {row.original.email}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'island',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Sziget
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-semibold text-foreground'>
          {row.original.island}
        </span>
      </div>
    ),
  },
  {
    id: 'address',
    accessorFn: (row) =>
      `${row.country}, ${row.postalCode} ${row.city}, ${row.street} ${row.houseNumber}`,
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Szállás címe
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-semibold text-foreground'>
          {row.original.country}, {row.original.postalCode} {row.original.city},{' '}
          {row.original.street} {row.original.houseNumber}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'quoteCount',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Beérkezett ajánlatkérések
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <div className='leading-none'>
        <div className='flex flex-col'>
          <span className='font-semibold text-foreground'>
            {row.original.quoteCount}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'rentCount',
    header: ({ column }) => (
      <button
        type='button'
        className='flex items-center gap-1'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Beérkezett foglalások
        <SortIndicator direction={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <div className='leading-none'>
        <div className='flex flex-col'>
          <span className='font-semibold text-foreground'>
            {row.original.rentCount}
          </span>
        </div>
      </div>
    ),
  },
];
