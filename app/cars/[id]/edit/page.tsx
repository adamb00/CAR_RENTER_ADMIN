import { notFound, redirect } from 'next/navigation';

import { deleteCarAction } from '@/actions/updateCarAction';
import { CarFleetSection } from '@/components/car-fleet-section';
import { NewCarForm } from '@/components/new-car-form';
import { CAR_COLORS, type CarColorOption } from '@/lib/car-options';
import { db } from '@/lib/db';
import { getFleetPlaceColor, getFleetPlaceLabel } from '@/lib/fleet-places';
import { formatDateForInput } from '@/lib/format/format-date';
import type { CreateCarFormValues } from '@/schemas/carSchema';

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const carQuery = {
    where: { id },
    include: {
      colors: {
        select: { name: true },
      },
      fleetVehicles: {
        select: {
          id: true,
          plate: true,
          odometer: true,
          status: true,
          year: true,
          location: true,
          inspectionExpiry: true,
        },
      },
    },
  } satisfies Parameters<typeof db.car.findUnique>[0];
  const car = await db.car.findUnique(carQuery);

  if (!car) {
    notFound();
  }

  const handleDelete = async () => {
    'use server';
    const result = await deleteCarAction(id);
    if (result?.error) {
      throw new Error(result.error);
    }
    redirect('/cars');
  };

  const initialValues: Partial<CreateCarFormValues> = {
    manufacturer: car.manufacturer,
    model: car.model,
    seats: car.seats,
    smallLuggage: car.smallLuggage,
    largeLuggage: car.largeLuggage,
    bodyType: car.bodyType,
    fuel: car.fuel,
    transmission: car.transmission,
    monthlyPrices: car.monthlyPrices,
    colors: car.colors
      .map((color: { name: string }) => color.name)
      .filter((name: string): name is CarColorOption =>
        (CAR_COLORS as readonly string[]).includes(name),
      ),
    images: car.images,
  };

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>
          {`Autó szerkesztése: ${car.manufacturer} ${car.model}`}
        </h1>
      </div>
      <form className='flex items-center' action={handleDelete}>
        <button
          type='submit'
          className='rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-100'
        >
          Törlés
        </button>
      </form>
      <NewCarForm mode='edit' initialValues={initialValues} carId={car.id} />
      <CarFleetSection
        carLabel={`${car.manufacturer} ${car.model}`}
        carId={car.id}
        initialRows={car.fleetVehicles.map((fleet) => ({
          id: fleet.id,
          plate: fleet.plate,
          odometer: fleet.odometer,
          status: fleet.status,
          year: fleet.year?.toString() ?? '',
          firstRegistration: '',
          location: getFleetPlaceLabel(fleet.location),
          locationColor: getFleetPlaceColor(fleet.location),
          vin: '',
          engineNumber: '',
          addedAt: '',
          inspectionExpiry: formatDateForInput(fleet.inspectionExpiry),
          notes: '',
          damages: '',
        }))}
      />
    </div>
  );
}
