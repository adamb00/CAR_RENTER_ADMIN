import CarinForm from '@/components/carin-form';
import { getBookingById } from '@/data-service/bookings';
import { getVehicleById } from '@/data-service/cars';
import { formatDateShort } from '@/lib/format-date';
import { db } from '@/lib/db';

export default async function BookingReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await getBookingById(id);
  const vehicle = await getVehicleById(booking?.assignedFleetVehicleId ?? '');
  const handoverOut =
    booking?.id && vehicle?.id
      ? await db.vehicleHandover.findFirst({
          where: {
            bookingId: booking.id,
            fleetVehicleId: vehicle.id,
            direction: 'out',
          },
          orderBy: { handoverAt: 'desc' },
          select: { mileage: true },
        })
      : null;

  return (
    <div className='flex h-full flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Visszavétel</h1>
        <p className='text-muted-foreground'>
          Itt lesznek a visszavételhez kapcsolódó teendők és adatok.
        </p>
      </div>
      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <p className='text-sm text-muted-foreground'>
          Foglalás azonosító:{' '}
          <span className='font-medium text-foreground'>
            {booking?.humanId}
          </span>
        </p>
        <p className='text-sm text-muted-foreground'>
          Foglalt autó:{' '}
          <span className='font-medium text-foreground'>
            {booking?.carLabel} &bull; {formatDateShort(booking?.rentalStart)} -{' '}
            {formatDateShort(booking?.rentalEnd)} &bull; {booking?.rentalDays}{' '}
            nap
          </span>
        </p>
      </div>
      <CarinForm
        booking={booking}
        vehicle={vehicle}
        handoverOutMileage={handoverOut?.mileage ?? null}
      />
    </div>
  );
}
