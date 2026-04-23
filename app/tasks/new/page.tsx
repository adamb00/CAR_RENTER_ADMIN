import { auth } from '@/auth';
import NewTask from '@/components/tasks/new-task';
import { Booking, getBookingById, getBookings } from '@/data-service/bookings';
import { getFleetCars } from '@/data-service/cars';
import { getAllUser } from '@/data-service/user';
import { FleetVehicle, User } from '@prisma/client';
import React from 'react';

type TaskNewPageSearchParams = {
  bookingId?: string | string[];
};

export default async function page({
  searchParams,
}: {
  searchParams?: Promise<TaskNewPageSearchParams>;
}) {
  const [fleet, users, bookings] = await Promise.all([
    getFleetCars(),
    getAllUser(),
    getBookings(),
  ]);
  const session = await auth();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const bookingId = Array.isArray(resolvedSearchParams?.bookingId)
    ? resolvedSearchParams?.bookingId[0]
    : resolvedSearchParams?.bookingId;

  let booking;

  if (bookingId) booking = await getBookingById(bookingId);

  const bookingOptions = bookings.slice(0, 200).map((item) => ({
    id: item.id,
    label: item.humanId ?? item.id,
    contactName: item.contactName,
    rentalStart: item.rentalStart ?? null,
    rentalEnd: item.rentalEnd ?? null,
    status: item.status ?? null,
    assignedCarId: item.assignedFleetVehicleId ?? null,
  }));

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Feladat kiosztása
        </h1>
      </div>
      <NewTask
        users={users}
        currentUser={session?.user as User | undefined}
        booking={booking as Booking}
        fleet={fleet as FleetVehicle[]}
        bookingOptions={bookingOptions}
      />
    </div>
  );
}
