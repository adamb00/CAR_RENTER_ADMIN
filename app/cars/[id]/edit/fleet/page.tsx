import { notFound } from 'next/navigation';

import { FleetAddForm } from '@/components/car/car-fleet-add-form';
import { db } from '@/lib/db';

export default async function CarFleetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const car = await db.car.findUnique({
    where: { id },
    select: { manufacturer: true, model: true },
  });

  if (!car) {
    notFound();
  }

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>
          {`Autó felvétele a flottába: ${car.manufacturer} ${car.model}`}
        </h1>
        <p className='text-muted-foreground'>
          Add meg az új példány adatait ehhez a típushoz.
        </p>
      </div>
      <FleetAddForm carId={id} />
    </div>
  );
}
