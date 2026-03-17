import CaroutForm from '@/components/carout-form';
import { getBookingById } from '@/data-service/bookings';
import { getVehicleById } from '@/data-service/cars';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/format/format-date';
import Link from 'next/link';

export default async function BookingIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await getBookingById(id);
  const vehicle = await getVehicleById(booking?.assignedFleetVehicleId ?? '');
  const handoverOutRecord =
    booking?.id && vehicle?.id
      ? await db.vehicleHandover.findFirst({
          where: {
            bookingId: booking.id,
            fleetVehicleId: vehicle.id,
            direction: 'out',
          },
          orderBy: [{ handoverAt: 'desc' }, { createdAt: 'desc' }],
          select: {
            handoverAt: true,
            handoverBy: true,
            mileage: true,
            rangeKm: true,
            notes: true,
            damages: true,
            damagesImages: true,
          },
        })
      : null;
  const handoverOut = handoverOutRecord
    ? {
        ...handoverOutRecord,
        handoverAt: handoverOutRecord.handoverAt.toISOString(),
      }
    : null;

  return (
    <div className='flex h-full flex-col gap-6 p-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Kiadás</h1>
          <p className='text-muted-foreground'>
            Itt lesznek a kiadáshoz kapcsolódó teendők és adatok.
          </p>
        </div>
        {booking?.id && (
          <Link
            className='inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-accent'
            href={`/bookings/${booking.id}/contract`}
          >
            Digitális szerződés
          </Link>
        )}
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
            {booking?.carLabel} &bull;{' '}
            {formatDate(booking?.rentalStart, 'short')} -{' '}
            {formatDate(booking?.rentalEnd, 'short')}
          </span>
        </p>
      </div>
      <CaroutForm booking={booking} vehicle={vehicle} handoverOut={handoverOut} />
    </div>
  );
}
