import { BookingCalendar } from '@/components/booking/booking-calendar';
import { getBookings } from '@/data-service/bookings';
import { db } from '@/lib/db';
import { resolveDeliveryIsland } from '@/lib/delivery-island';
import { formatPlaceType } from '@/lib/format/format-place';

type CalendarVehicleHandover = {
  bookingId: string;
  direction: 'out' | 'in';
  handoverAt: Date;
};

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
  const vehicleHandovers: CalendarVehicleHandover[] = bookingIds.length
    ? await db.vehicleHandover.findMany({
        where: {
          bookingId: { in: bookingIds },
          direction: { in: ['out', 'in'] },
        },
        select: {
          bookingId: true,
          direction: true,
          handoverAt: true,
        },
        orderBy: { handoverAt: 'asc' },
      })
    : [];
  const carOutBookingIds = Array.from(
    new Set(
      vehicleHandovers
        .filter((handover) => handover.direction === 'out')
        .map((handover) => handover.bookingId),
    ),
  );
  const handoverByBookingId = new Map<
    string,
    { outAt?: string; inAt?: string }
  >();

  for (const handover of vehicleHandovers) {
    const previous = handoverByBookingId.get(handover.bookingId) ?? {};
    if (handover.direction === 'out') {
      if (!previous.outAt) {
        handoverByBookingId.set(handover.bookingId, {
          ...previous,
          outAt: handover.handoverAt.toISOString(),
        });
      }
      continue;
    }

    handoverByBookingId.set(handover.bookingId, {
      ...previous,
      inAt: handover.handoverAt.toISOString(),
    });
  }

  const calendarBookings = bookings.map((booking) => {
    const deliveryAddress = booking.delivery?.address?.street?.trim() ?? '';
    const deliveryLocationName = booking.delivery?.locationName?.trim() ?? '';
    const deliveryLabel =
      booking.delivery?.placeType === 'airport'
        ? formatPlaceType(booking.delivery?.placeType?.trimEnd())
        : [deliveryLocationName, deliveryAddress]
            .filter((value) => value.length > 0)
            .join(' ');
    const deliveryLocation =
      deliveryLabel ||
      formatPlaceType(booking.delivery?.placeType?.trimEnd()) ||
      booking.pricing?.deliveryLocation?.trim() ||
      null;
    const deliveryIsland =
      booking.deliveryIsland ??
      booking.delivery?.island?.trim() ??
      resolveDeliveryIsland({
        locationName: deliveryLocation,
        addressLine: booking.delivery?.address?.street ?? null,
        arrivalFlight: booking.delivery?.arrivalFlight ?? null,
        departureFlight: booking.delivery?.departureFlight ?? null,
      });

    const arrival = `${booking.delivery?.arrivalHour ?? '-'}:${booking.delivery?.arrivalMinute ?? '-'}`;
    const handoverTimes = handoverByBookingId.get(booking.id);

    return {
      id: booking.id,
      humanId: booking.humanId ?? null,
      contactName: booking.contactName,
      rentalStart: booking.rentalStart,
      rentalEnd: booking.rentalEnd,
      arrivalHour: booking.delivery?.arrivalHour ?? null,
      arrivalMinute: booking.delivery?.arrivalMinute ?? null,
      handoverOutAt: handoverTimes?.outAt ?? null,
      handoverInAt: handoverTimes?.inAt ?? null,
      status: booking.status ?? null,
      assignedFleetVehicleId: booking.assignedFleetVehicleId,
      carLabel: booking.carLabel ?? null,
      deliveryLocation,
      deliveryIsland,
      pricing: booking.pricing ?? null,
      arrival,
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
