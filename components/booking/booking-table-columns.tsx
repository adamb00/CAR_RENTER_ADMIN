import type { Booking } from '@/data-service/bookings';
import { formatDate, formatDatePeriod } from '@/lib/format/format-date';
import { formatLocale } from '@/lib/format/format-locale';
import { RENT_STATUS_NEW } from '@/lib/constants';
import { getStatusMeta } from '@/lib/status';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';

const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000;

const isStaleNewBooking = (booking: Booking) => {
  if (booking.status?.toLowerCase() !== RENT_STATUS_NEW || !booking.createdAt) {
    return false;
  }

  const createdAt = new Date(booking.createdAt).getTime();
  return Number.isFinite(createdAt) && Date.now() - createdAt >= TWO_DAYS_IN_MS;
};

export const BookingTableColumns: ColumnDef<Booking>[] = [
  {
    header: 'Foglaló',
    cell: ({ row }) => {
      const shouldHighlightContactName = isStaleNewBooking(row.original);

      return (
        <div className='flex flex-col gap-1'>
          <div
            className={cn(
              'text-base font-semibold text-foreground',
              shouldHighlightContactName && 'text-red-600',
            )}
          >
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
          <div className='text-xs text-muted-foreground'>
            {row.original.assignedFleetPlate && row.original.carLabel
              ? `${row.original.carLabel} - ${row.original.assignedFleetPlate}`
              : ''}
          </div>
        </div>
      );
    },
  },
  {
    header: 'Időszak',
    cell: ({ row }) => (
      <div className='whitespace-nowrap text-muted-foreground'>
        {formatDatePeriod(row.original.rentalStart, row.original.rentalEnd)}
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
        {formatDate(row.original.createdAt, 'short')}
      </div>
    ),
  },
];
