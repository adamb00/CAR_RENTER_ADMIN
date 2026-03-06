import { BookingCalendar } from '@/components/booking-calendar';
import { getBookings } from '@/data-service/bookings';
import { db } from '@/lib/db';
import { resolveDeliveryIsland } from '@/lib/delivery-island';

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
  const carOutBookings = bookingIds.length
    ? await db.bookingHandoverCost.findMany({
        where: {
          bookingId: { in: bookingIds },
          direction: 'out',
        },
        select: { bookingId: true },
        distinct: ['bookingId'],
      })
    : [];
  const carOutBookingIds = carOutBookings.map((booking) => booking.bookingId);

  const calendarBookings = bookings.map((booking) => {
    const deliveryLocation =
      booking.payload?.delivery?.locationName?.trim() ||
      booking.payload?.delivery?.address?.street?.trim() ||
      booking.payload?.pricing?.deliveryLocation?.trim() ||
      null;
    const deliveryIsland =
      booking.deliveryIsland ??
      booking.payload?.delivery?.island?.trim() ??
      resolveDeliveryIsland({
        locationName: deliveryLocation,
        addressLine: booking.payload?.delivery?.address?.street ?? null,
        arrivalFlight: booking.payload?.delivery?.arrivalFlight ?? null,
        departureFlight: booking.payload?.delivery?.departureFlight ?? null,
      });

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
      deliveryIsland,
      pricing: booking.payload?.pricing ?? booking.pricing ?? null,
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
        carOutBookingIds={carOutBookingIds}
      />
    </div>
  );
}
