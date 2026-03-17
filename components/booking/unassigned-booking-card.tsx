import { useState, type DragEvent } from 'react';
import { BookingCalendarBooking, BookingCalendarVehicle } from './types';
import { getStatusMeta } from '@/lib/status';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { getLocationColor } from './utils';

type UnassignedBookingCardProps = {
  booking: BookingCalendarBooking;
  fleetVehicles: BookingCalendarVehicle[];
  disabled?: boolean;
  onAssign: (bookingId: string, vehicleId: string) => void;
  onDragStart?: (
    event: DragEvent<HTMLDivElement>,
    booking: BookingCalendarBooking,
  ) => void;
  onDragEnd?: () => void;
};
export const UnassignedBookingCard = ({
  booking,
  fleetVehicles,
  disabled,
  onAssign,
  onDragStart,
  onDragEnd,
}: UnassignedBookingCardProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const selectedVehicleDetails = fleetVehicles.find(
    (vehicle) => vehicle.id === selectedVehicle,
  );
  const selectedVehicleColor = selectedVehicleDetails
    ? getLocationColor(selectedVehicleDetails.location)
    : '#888888';

  const meta = getStatusMeta(booking.status);
  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border px-3 py-3',
        disabled ? 'opacity-70' : 'cursor-grab active:cursor-grabbing',
      )}
      draggable={!disabled}
      onDragStart={(event) => onDragStart?.(event, booking)}
      onDragEnd={() => onDragEnd?.()}
    >
      <div className='font-semibold'>
        <div className='flex items-center gap-2'>
          <span>
            {`${booking.humanId ? `(${booking.humanId}) ` : ''}${booking.contactName}${booking.carLabel ? ` - ${booking.carLabel}` : ''}`}
          </span>
          {meta?.label && (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${meta.badge}`}
            >
              {meta.label}
            </span>
          )}
        </div>
      </div>
      <div className='text-sm text-muted-foreground'>
        {booking.rentalStart} → {booking.rentalEnd}
      </div>
      <div className='text-sm text-muted-foreground mb-4'>
        Átvétel helye:{' '}
        <span className='font-medium text-foreground'>
          {booking.deliveryLocation?.trim() || '—'}
        </span>
      </div>
      <div className='text-sm text-muted-foreground mb-4'>
        Sziget:{' '}
        <span className='font-medium text-foreground'>
          {booking.deliveryIsland?.trim() || '-'}
        </span>
      </div>

      <div className='space-y-1'>
        <div className='relative w-full'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type='button'
                variant='outline'
                className='peer h-12 w-full justify-start font-normal'
                disabled={disabled || fleetVehicles.length === 0}
              >
                <span className='inline-flex items-center gap-2 truncate'>
                  <span
                    className='h-2.5 w-2.5 shrink-0 rounded-full border border-black/10'
                    style={{ backgroundColor: selectedVehicleColor }}
                    aria-hidden
                  />
                  <span className='truncate'>
                    {selectedVehicleDetails
                      ? `${selectedVehicleDetails.plate} - ${selectedVehicleDetails.carLabel}`
                      : fleetVehicles.length === 0
                        ? 'Nincs elérhető autó'
                        : 'Válassz autót'}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              className='w-(--radix-dropdown-menu-trigger-width)'
            >
              {fleetVehicles.length === 0 ? (
                <DropdownMenuItem disabled>
                  Nincs elérhető autó
                </DropdownMenuItem>
              ) : (
                fleetVehicles.map((vehicle) => (
                  <DropdownMenuItem
                    key={vehicle.id}
                    className='cursor-pointer transition-colors hover:bg-sky-100! hover:text-slate-900! data-highlighted:bg-sky-100! data-highlighted:text-slate-900! dark:hover:bg-sky-900/40! dark:hover:text-slate-50! dark:data-highlighted:bg-sky-900/40! dark:data-highlighted:text-slate-50!'
                    onSelect={() => setSelectedVehicle(vehicle.id)}
                  >
                    <span className='inline-flex items-center gap-2'>
                      <span
                        className='h-2.5 w-2.5 rounded-full border border-black/10'
                        style={{
                          backgroundColor: getLocationColor(vehicle.location),
                        }}
                        aria-hidden
                      />
                      <span>{vehicle.plate}</span>
                      <span className='text-muted-foreground'>
                        - {vehicle.carLabel}
                      </span>
                      <span className='text-muted-foreground'>
                        - {booking.humanId}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <label className='pointer-events-none absolute -top-2 left-3 translate-x-2 bg-background px-2 text-sm text-slate-600'>
            Flotta autó
          </label>
        </div>
      </div>
      <Button
        type='button'
        className='w-full'
        disabled={disabled || !selectedVehicle}
        onClick={() => onAssign(booking.id, selectedVehicle)}
      >
        Hozzárendelés
      </Button>
    </div>
  );
};
