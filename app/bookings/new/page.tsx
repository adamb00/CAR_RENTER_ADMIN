import { ManualBookingForm } from '@/components/manual-booking-form';
import { db } from '@/lib/db';

type PageSearchParams = Record<string, string | string[] | undefined>;

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function ManualBookingPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedFleetVehicleId = firstParam(resolvedSearchParams?.vehicleId);
  const requestedRentalStart = firstParam(resolvedSearchParams?.rentalStart);
  const requestedRentalEnd = firstParam(resolvedSearchParams?.rentalEnd);

  const [fleetVehicles, cars] = await Promise.all([
    db.fleetVehicle.findMany({
      include: {
        car: {
          select: {
            manufacturer: true,
            model: true,
          },
        },
      },
      orderBy: { plate: 'asc' },
    }),
    db.car.findMany({
      select: {
        id: true,
        manufacturer: true,
        model: true,
      },
      orderBy: [{ manufacturer: 'asc' }, { model: 'asc' }],
    }),
  ]);

  const fleetOptions = fleetVehicles.map((vehicle) => ({
    id: vehicle.id,
    plate: vehicle.plate,
    carLabel: `${vehicle.car.manufacturer} ${vehicle.car.model}`.trim(),
    carId: vehicle.carId,
  }));
  const carOptions = cars.map((car) => ({
    id: car.id,
    label: `${car.manufacturer} ${car.model}`.trim(),
  }));

  const preselectedFleet = requestedFleetVehicleId
    ? fleetOptions.find((fleet) => fleet.id === requestedFleetVehicleId)
    : undefined;

  const initialValues = {
    fleetVehicleId: preselectedFleet?.id ?? '',
    rentalStart: requestedRentalStart ?? '',
    rentalEnd: requestedRentalEnd ?? '',
    carId: preselectedFleet?.carId ?? '',
  };
  const lockFleetVehicle = Boolean(preselectedFleet);

  return (
    <div className='flex h-full w-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Új foglalás hozzáadása kézzel
        </h1>
        <p className='text-muted-foreground'>
          Add meg a részletes foglalási adatokat, majd mentsd a foglalást.
        </p>
      </div>
      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <ManualBookingForm
          fleetOptions={fleetOptions}
          carOptions={carOptions}
          initialValues={initialValues}
          lockFleetVehicle={lockFleetVehicle}
        />
      </div>
    </div>
  );
}
