import { notFound } from 'next/navigation';

import { FleetAddForm } from '@/components/fleet-add-form';
import { db } from '@/lib/db';
import { getFleetPlaceLabel } from '@/lib/fleet-places';

export default async function FleetVehicleEditPage({
  params,
}: {
  params: Promise<{ id: string; fleetId: string }>;
}) {
  const { id, fleetId } = await params;

  const carPromise = db.car.findUnique({
    where: { id },
    select: { manufacturer: true, model: true },
  });
  const fleetVehiclePromise = db.fleetVehicle.findFirst({
    where: { id: fleetId, carId: id },
  });

  const [car, fleetVehicle] = await Promise.all([
    carPromise,
    fleetVehiclePromise,
  ]);

  if (!car || !fleetVehicle) {
    notFound();
  }

  const initialValues = {
    plate: fleetVehicle.plate,
    odometer: fleetVehicle.odometer?.toString() ?? '',
    serviceIntervalKm: fleetVehicle.serviceIntervalKm?.toString() ?? '',
    lastServiceMileage: fleetVehicle.lastServiceMileage?.toString() ?? '',
    lastServiceAt:
      fleetVehicle.lastServiceAt?.toISOString().slice(0, 10) ?? '',
    status: fleetVehicle.status,
    year: fleetVehicle.year?.toString() ?? '',
    firstRegistration:
      fleetVehicle.firstRegistration?.toISOString().slice(0, 10) ?? '',
    location: getFleetPlaceLabel(fleetVehicle.location),
    vin: fleetVehicle.vin ?? '',
    engineNumber: fleetVehicle.engineNumber ?? '',
    addedAt: fleetVehicle.addedAt?.toISOString().slice(0, 10) ?? '',
    inspectionExpiry:
      fleetVehicle.inspectionExpiry?.toISOString().slice(0, 10) ?? '',
    notes: fleetVehicle.notes ?? '',
    damages: fleetVehicle.damages ?? '',
    damagesImages: fleetVehicle.damagesImages ?? [],
  };

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>
          {`Flotta autó módosítása: ${car.manufacturer} ${car.model}`}
        </h1>
        <p className='text-muted-foreground'>
          {`Rendszám: ${fleetVehicle.plate}`}
        </p>
      </div>
      <FleetAddForm
        mode='edit'
        carId={id}
        vehicleId={fleetVehicle.id}
        initialValues={initialValues}
      />
    </div>
  );
}
