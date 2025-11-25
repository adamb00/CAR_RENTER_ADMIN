import { notFound, redirect } from 'next/navigation';

import { deleteCarAction } from '@/actions/updateCarAction';
import { NewCarForm } from '@/components/new-car-form';
import { db } from '@/lib/db';
import type { CreateCarFormValues } from '@/schemas/carSchema';

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const car = await db.car.findUnique({
    where: { id },
    include: {
      colors: {
        select: { name: true },
      },
    },
  });

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
    colors: car.colors.map((color) => color.name),
    images: car.images,
  };

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Autó szerkesztése
        </h1>
        <p className='text-muted-foreground'>
          Csak a fotók, a márka, a típus, a férőhelyek, a kis/nagy bőröndök
          száma, a kivitel, az üzemanyag, a váltó, az elérhető színek és a havi árak maradtak.
        </p>
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
    </div>
  );
}
