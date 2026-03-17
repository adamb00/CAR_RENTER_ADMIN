import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  FleetAddForm,
  type FleetEditSection,
} from '@/components/car/car-fleet-add-form';
import { FLEET_EDIT_SECTIONS } from '@/lib/constants';
import { db } from '@/lib/db';
import { getFleetPlaceLabel } from '@/lib/fleet-places';
import { formatDateForInput } from '@/lib/format/format-date';
import { cn } from '@/lib/utils';

type FleetEditContentProps = {
  carId: string;
  fleetId: string;
  section: FleetEditSection;
};

export async function FleetEditContent({
  carId,
  fleetId,
  section,
}: FleetEditContentProps) {
  const carPromise = db.car.findUnique({
    where: { id: carId },
    select: { manufacturer: true, model: true },
  });
  const fleetVehiclePromise = db.fleetVehicle.findFirst({
    where: { id: fleetId, carId },
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
    lastServiceAt: formatDateForInput(fleetVehicle.lastServiceAt),
    status: fleetVehicle.status,
    year: fleetVehicle.year?.toString() ?? '',
    firstRegistration: formatDateForInput(fleetVehicle.firstRegistration),
    location: getFleetPlaceLabel(fleetVehicle.location),
    vin: fleetVehicle.vin ?? '',
    engineNumber: fleetVehicle.engineNumber ?? '',
    addedAt: formatDateForInput(fleetVehicle.addedAt),
    inspectionExpiry: formatDateForInput(fleetVehicle.inspectionExpiry),
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

      <div className='flex flex-wrap gap-2'>
        {FLEET_EDIT_SECTIONS.map((item) => (
          <Link
            key={item.id}
            href={`/cars/${carId}/edit/fleet/${fleetId}/${item.id}`}
            className={cn(
              'rounded-md border px-3 py-2 text-sm transition-colors',
              section === item.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/60',
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <FleetAddForm
        mode='edit'
        carId={carId}
        vehicleId={fleetVehicle.id}
        section={section}
        initialValues={initialValues}
      />
    </div>
  );
}
