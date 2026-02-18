import { BookingCalendar } from '@/components/booking-calendar';
import { db } from '@/lib/db';
import { getBookings } from '@/data-service/bookings';

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
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Naptár</h1>
        <p className='text-muted-foreground'>
          Foglalások áttekintése és flotta autók hozzárendelése.
        </p>
      </div>
      <BookingCalendar
        bookings={bookings}
        fleetVehicles={fleet}
        handoverOutKeys={handoverOutKeys}
      />
    </div>
  );
}
