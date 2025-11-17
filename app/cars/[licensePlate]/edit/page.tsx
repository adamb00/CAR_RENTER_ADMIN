import { notFound, redirect } from 'next/navigation';

import { NewCarForm } from '@/components/new-car-form';
import { db } from '@/lib/db';
import { activateCarAction, deactivateCarAction, deleteCarAction } from '@/actions/updateCarAction';
import type { CreateCarFormValues } from '@/schemas/carSchema';
import { RENTAL_DAY_THRESHOLDS } from '@/schemas/carSchema';

const toDateInput = (value: Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const mapDailyPrices = (
  dailyPrices: number[]
): CreateCarFormValues['dailyPrices'] => {
  return RENTAL_DAY_THRESHOLDS.reduce((acc, _threshold, index) => {
    acc[`day${index + 1}` as keyof CreateCarFormValues['dailyPrices']] =
      dailyPrices[index] ?? 0;
    return acc;
  }, {} as CreateCarFormValues['dailyPrices']);
};

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ licensePlate: string }>;
}) {
  const resolvedParams = await params;
  const car = await db.car.findUnique({
    where: { licensePlate: resolvedParams.licensePlate },
  });

  if (!car) {
    notFound();
  }

  const isInactive = car.status === 'inactive';

  const handleToggleStatus = async () => {
    'use server';
    const action = isInactive ? activateCarAction : deactivateCarAction;
    const result = await action(car.licensePlate);
    if (result?.error) {
      throw new Error(result.error);
    }
    redirect('/cars');
  };

  const handleDelete = async () => {
    'use server';
    const result = await deleteCarAction(car.licensePlate);
    if (result?.error) {
      throw new Error(result.error);
    }
    redirect('/cars');
  };

  const initialValues: Partial<CreateCarFormValues> = {
    licensePlate: car.licensePlate,
    category: car.category,
    manufacturer: car.manufacturer,
    model: car.model,
    year: car.year,
    firstRegistration: toDateInput(car.firstRegistration),
    bodyType: car.bodyType,
    colors: car.colors.filter(
      (color: string): color is CreateCarFormValues['colors'][number] =>
        [
          'milky_beige',
          'white',
          'silver_metal',
          'blue',
          'metal_blue',
          'gray',
        ].includes(color)
    ),
    images: car.images,
    dailyPrices: mapDailyPrices(car.dailyPrices),
    description: car.description ?? '',
    seats: car.seats,
    odometer: car.odometer,
    smallLuggage: car.smallLuggage,
    largeLuggage: car.largeLuggage,
    transmission: car.transmission,
    fuel: car.fuel,
    vin: car.vin,
    engineNumber: car.engineNumber,
    fleetJoinedAt: toDateInput(car.fleetJoinedAt),
    status: car.status,
    inspectionValidUntil: toDateInput(car.inspectionValidUntil),
    tires: car.tires,
    nextServiceAt: toDateInput(car.nextServiceAt ?? null),
    serviceNotes: car.serviceNotes ?? '',
    notes: car.notes ?? '',
    knownDamages: car.knownDamages ?? '',
  };

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Autó szerkesztése
        </h1>
        <p className='text-muted-foreground'>
          Módosítsd az alábbi űrlapon az autó adatait, majd mentsd el a
          változtatásokat.
        </p>
      </div>
      <div className='flex flex-wrap gap-3'>
        <form className='flex items-center' action={handleToggleStatus}>
          {isInactive ? (
            <button
              type='submit'
              className='rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100'
            >
              Aktiválás
            </button>
          ) : (
            <button
              type='submit'
              className='rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100'
            >
              Inaktiválás
            </button>
          )}
        </form>
        <form className='flex items-center' action={handleDelete}>
          <button
            type='submit'
            className='rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-100'
          >
            Törlés
          </button>
        </form>
      </div>
      <NewCarForm
        mode='edit'
        initialValues={initialValues}
        originalLicensePlate={car.licensePlate}
      />
    </div>
  );
}
