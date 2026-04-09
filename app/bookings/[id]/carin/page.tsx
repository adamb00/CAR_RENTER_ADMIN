import CarinForm from '@/components/carin-form';
import { getBookingById } from '@/data-service/bookings';
import { getVehicleById } from '@/data-service/cars';
import { getAllUser } from '@/data-service/user';
import { getRequiredCarsCount, splitPricingByCars } from '@/lib/booking-pricing-share';
import { formatDate } from '@/lib/format/format-date';
import { db } from '@/lib/db';

export default async function BookingReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ slot?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const booking = await getBookingById(id);
  const users = await getAllUser();
  const requestedSlotIndex = Number.parseInt(
    resolvedSearchParams?.slot ?? '0',
    10,
  );
  const slotIndex = Number.isFinite(requestedSlotIndex)
    ? Math.max(0, requestedSlotIndex)
    : 0;
  const selectedAssignment =
    booking?.fleetAssignments.find(
      (assignment) => assignment.slotIndex === slotIndex,
    ) ?? booking?.fleetAssignments[0];
  const vehicle = await getVehicleById(
    selectedAssignment?.fleetVehicleId ?? booking?.assignedFleetVehicleId ?? '',
  );
  const pricing = splitPricingByCars(
    booking?.pricing,
    getRequiredCarsCount(booking?.payload?.cars),
  );
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
        <p className='text-muted-foreground'>{vehicle?.plate}</p>
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
            {formatDate(booking?.rentalEnd, 'short')} &bull;{' '}
            {booking?.rentalDays} nap
          </span>
        </p>
        {(booking?.payload?.cars ?? 1) > 1 && (
          <p className='text-sm text-muted-foreground'>
            Slot:{' '}
            <span className='font-medium text-foreground'>
              {slotIndex + 1} / {booking?.payload?.cars}
            </span>
          </p>
        )}
      </div>
      <CarinForm
        booking={booking}
        pricing={pricing ?? null}
        vehicle={vehicle}
        handoverOutMileage={handoverOut?.mileage ?? null}
        users={users}
      />
    </div>
  );
}
