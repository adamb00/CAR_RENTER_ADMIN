import { BookingCalendar } from '@/components/booking-calendar';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { getBookings } from '@/data-service/bookings';
import Link from 'next/link';

export default async function CalendarPage() {
  const [bookings, fleetVehicles] = await Promise.all([
    getBookings(),
    db.fleetVehicle.findMany({
      include: {
        car: { select: { manufacturer: true, model: true, id: true } },
      },
      orderBy: { plate: 'asc' },
    }),
  ]);

  const bookingIds = bookings.map((booking) => booking.id);
  const handoverOutPairs = bookingIds.length
    ? await db.vehicleHandover.findMany({
        where: {
          bookingId: { in: bookingIds },
          direction: 'out',
        },
        select: { bookingId: true, fleetVehicleId: true },
      })
    : [];
  const handoverOutKeys = handoverOutPairs.map(
    (handover) => `${handover.bookingId}:${handover.fleetVehicleId}`,
  );

  const calendarBookings = bookings.map((booking) => {
    const deliveryLocation =
      booking.payload?.delivery?.locationName?.trim() ||
      booking.payload?.delivery?.address?.street?.trim() ||
      null;

    return {
      id: booking.id,
      humanId: booking.humanId ?? null,
      contactName: booking.contactName,
      rentalStart: booking.rentalStart,
      rentalEnd: booking.rentalEnd,
      status: booking.status ?? null,
      assignedFleetVehicleId: booking.assignedFleetVehicleId,
      carLabel: booking.carLabel ?? null,
      deliveryLocation,
    };
  });

  const fleet = fleetVehicles.map((vehicle) => ({
    id: vehicle.id,
    plate: vehicle.plate,
    status: vehicle.status,
    carLabel: `${vehicle.car.manufacturer} ${vehicle.car.model}`.trim(),
    carId: vehicle.car.id,
    location: vehicle.location ?? '',
    notes: vehicle.notes ?? null,
    odometer: vehicle.odometer ?? 0,
    serviceIntervalKm: vehicle.serviceIntervalKm ?? null,
    lastServiceMileage: vehicle.lastServiceMileage ?? null,
  }));

  return (
    <div className='flex h-full flex-col gap-6 p-6 max-w-full'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Naptár</h1>
          <p className='text-muted-foreground'>
            Foglalások áttekintése és flotta autók hozzárendelése.
          </p>
        </div>
      </div>
      <BookingCalendar
        bookings={calendarBookings}
        fleetVehicles={fleet}
        handoverOutKeys={handoverOutKeys}
      />
    </div>
  );
}
