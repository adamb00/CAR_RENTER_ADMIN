import CaroutForm from '@/components/carout-form';
import { getBookingById } from '@/data-service/bookings';
import { formatDateShort } from '@/lib/format-date';
import Link from 'next/link';

export default async function BookingIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await getBookingById(id);

  return (
    <div className='flex h-full flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Kiadás</h1>
        <p className='text-muted-foreground'>
          Itt lesznek a kiadáshoz kapcsolódó teendők és adatok.
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
      <CaroutForm booking={booking} />
    </div>
  );
}
