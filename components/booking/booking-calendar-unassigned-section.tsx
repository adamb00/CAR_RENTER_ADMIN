'use client';

import { UnassignedBookingCard } from './unassigned-booking-card';
import { BookingCalendarModel } from '../../hooks/use-booking-calendar';
import { RENT_STATUS_CANCELLED } from '@/lib/constants';

type BookingCalendarUnassignedSectionProps = {
  calendar: BookingCalendarModel;
};

export function BookingCalendarUnassignedSection({
  calendar,
}: BookingCalendarUnassignedSectionProps) {
  return (
    <div
      className='space-y-4 rounded-xl border bg-card/40 p-4 shadow-sm'
      onDragOver={calendar.handleUnassignedDragOver}
      onDrop={calendar.handleDropToUnassigned}
    >
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>
          Hozzárendelésre váró foglalások
        </h3>
        <span className='text-sm text-muted-foreground'>
          {
            calendar.unassignedBookings.filter(
              (booking) => booking.status !== RENT_STATUS_CANCELLED,
            ).length
          }{' '}
          tétel
        </span>
      </div>
      <div className='grid gap-3 md:grid-cols-2'>
        {calendar.unassignedBookings.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            Minden foglalásnál meg van adva flotta autó.
          </p>
        )}
        {calendar.unassignedBookings
          .filter((booking) => booking.status != RENT_STATUS_CANCELLED)
          .map((booking) => (
            <UnassignedBookingCard
              key={booking.id}
              booking={booking}
              fleetVehicles={calendar.getAvailableFleetVehicles(booking.id)}
              disabled={calendar.isPending}
              onAssign={calendar.handleAssign}
              onDragStart={(event, dragBooking) =>
                calendar.handleUnassignedBookingDragStart(event, dragBooking)
              }
              onDragEnd={calendar.handleDragEnd}
            />
          ))}
      </div>
    </div>
  );
}
