'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties, DragEvent, MouseEvent } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDate } from '@/lib/format/format-date';
import { formatPriceValue } from '@/lib/format/format-price';
import { getStatusMeta } from '@/lib/status';
import { cn } from '@/lib/utils';

import type {
  BookingCalendarVehicle,
  ContextMenuPoint,
  VisibleBooking,
} from './types';
import {
  getBookingIslandColor,
  getBookingIslandLabel,
  toDate,
  toIsoDate,
} from './utils';

type BookingCalendarBookingChipProps = {
  booking: VisibleBooking;
  vehicle: BookingCalendarVehicle;
  hasOut: boolean;
  isPending: boolean;
  dayColumnWidth: number;
  timelineWidth: number;
  bookingChipStyleBase: CSSProperties;
  contextMenuBookingId: string | null;
  contextMenuPoint: ContextMenuPoint | null;
  onBookingMenuOpenChange: (bookingId: string, open: boolean) => void;
  onOpenBookingMenu: (
    event: MouseEvent<HTMLElement>,
    bookingId: string,
  ) => void;
  onBookingDragStart: (
    event: DragEvent<HTMLElement>,
    booking: VisibleBooking,
    vehicleId: string,
    disabled?: boolean,
  ) => void;
  onBookingDragEnd: () => void;
};

export function BookingCalendarBookingChip({
  booking,
  vehicle,
  hasOut,
  isPending,
  dayColumnWidth,
  timelineWidth,
  bookingChipStyleBase,
  contextMenuBookingId,
  contextMenuPoint,
  onBookingMenuOpenChange,
  onOpenBookingMenu,
  onBookingDragStart,
  onBookingDragEnd,
}: BookingCalendarBookingChipProps) {
  const router = useRouter();
  const bookingColor = getBookingIslandColor(booking.deliveryIsland);
  const bookingIslandLabel = getBookingIslandLabel(booking.deliveryIsland);
  const bookingStartDate = toDate(booking.rentalStart);
  const bookingEndDate = toDate(booking.rentalEnd);
  const isSameDayBooking =
    bookingStartDate != null &&
    bookingEndDate != null &&
    toIsoDate(bookingStartDate) === toIsoDate(bookingEndDate);
  const bookingDayOffset = isSameDayBooking
    ? Math.floor(booking.offsetDays)
    : booking.offsetDays;
  const bookingLeftPx =
    bookingDayOffset * dayColumnWidth +
    (isSameDayBooking ? dayColumnWidth / 8 : 0);
  const bookingWidthPx = Math.max(
    6,
    isSameDayBooking
      ? dayColumnWidth * 0.75
      : booking.spanDays * dayColumnWidth,
  );
  const clampedBookingWidthPx = Math.max(
    6,
    Math.min(bookingWidthPx, Math.max(6, timelineWidth - bookingLeftPx)),
  );
  const bookingMenuItemStyle = {
    '--fleet-color': bookingColor,
  } as CSSProperties;

  return (
    <DropdownMenu
      open={contextMenuBookingId === booking.id}
      onOpenChange={(open) => onBookingMenuOpenChange(booking.id, open)}
    >
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden='true'
          className='pointer-events-none fixed h-1 w-1'
          style={{
            left: contextMenuPoint?.x ?? 0,
            top: contextMenuPoint?.y ?? 0,
          }}
        />
      </DropdownMenuTrigger>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'my-0 min-w-0 flex flex-col items-center justify-center gap-1 overflow-hidden rounded-md px-2 py-1 text-primary-foreground shadow-sm',
              hasOut || isPending
                ? 'cursor-default'
                : 'cursor-grab active:cursor-grabbing',
            )}
            data-booking-chip='true'
            style={{
              ...bookingChipStyleBase,
              position: 'absolute',
              left: `${bookingLeftPx}px`,
              width: `${clampedBookingWidthPx}px`,
              top: 4,
              zIndex: 2,
              boxSizing: 'border-box',
              backgroundColor: bookingColor,
              backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${
                dayColumnWidth - 1
              }px, rgba(255,255,255,0.28) ${dayColumnWidth - 1}px, rgba(255,255,255,0.28) ${dayColumnWidth}px)`,
              boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.2)',
            }}
            draggable={!isPending && !hasOut}
            onContextMenu={(event) => {
              event.preventDefault();
              onOpenBookingMenu(event, booking.id);
            }}
            onClick={(event) => onOpenBookingMenu(event, booking.id)}
            onDragStart={(event) =>
              onBookingDragStart(event, booking, vehicle.id, hasOut)
            }
            onDragEnd={onBookingDragEnd}
          >
            <div className='flex w-full min-w-0 items-center justify-center gap-2 text-xs font-semibold'>
              <span className='block max-w-full truncate'>
                {booking.contactName || 'Foglalás'}
              </span>
            </div>
            <div className='max-w-full truncate whitespace-nowrap text-[11px] opacity-90'>
              {formatDate(booking.rentalStart, 'short')} →{' '}
              {formatDate(booking.rentalEnd, 'short')}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side='top'
          sideOffset={6}
          className='min-w-64 space-y-1 text-xs'
        >
          <div>
            <strong>Foglalás:</strong> {booking.humanId ?? booking.id}
          </div>
          <div>
            <strong>Név:</strong> {booking.contactName || '—'}
          </div>
          <div>
            <strong>Időszak:</strong> {booking.rentalStart ?? '—'} →{' '}
            {booking.rentalEnd ?? '—'}
          </div>
          <div>
            <strong>Érkezés:</strong> {booking.arrival ?? '—'}
          </div>
          <div>
            <strong>Státusz:</strong> {getStatusMeta(booking.status).label}
          </div>
          <div>
            <strong>Autó:</strong> {vehicle.plate} - {vehicle.carLabel}
          </div>
          <div>
            <strong>Átvétel helye:</strong>{' '}
            {booking.deliveryLocation?.trim() || '—'}
          </div>
          <div>
            <strong>Sziget:</strong> {bookingIslandLabel}
          </div>
          <div>
            <strong>Bérleti díj:</strong>{' '}
            {formatPriceValue(booking.pricing?.rentalFee)}
          </div>
          <div>
            <strong>Kiszállási díj:</strong>{' '}
            {formatPriceValue(booking.pricing?.deliveryFee)}
          </div>
          <div>
            <strong>Biztosítási díj:</strong>{' '}
            {formatPriceValue(booking.pricing?.insurance)}
          </div>
          <div>
            <strong>Kaució:</strong>{' '}
            {formatPriceValue(booking.pricing?.deposit)}
          </div>
          <div>
            <strong>Extrák díja:</strong>{' '}
            {formatPriceValue(booking.pricing?.extrasFee)}
          </div>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align='start'>
        <DropdownMenuItem
          className='data-highlighted:bg-(--fleet-color) data-highlighted:text-primary-foreground'
          style={bookingMenuItemStyle}
          onSelect={() => router.push(`/bookings/${booking.id}/edit`)}
        >
          Megnyitás / Módosítás
        </DropdownMenuItem>
        <DropdownMenuItem
          className='data-highlighted:bg-(--fleet-color) data-highlighted:text-primary-foreground'
          style={bookingMenuItemStyle}
          onSelect={() => router.push(`/bookings/${booking.id}/carout`)}
        >
          Kiadás
        </DropdownMenuItem>
        <DropdownMenuItem
          className='data-highlighted:bg-(--fleet-color) data-highlighted:text-primary-foreground'
          style={bookingMenuItemStyle}
          onSelect={() => router.push(`/bookings/${booking.id}/carin`)}
          disabled={!hasOut}
        >
          Visszavétel
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
