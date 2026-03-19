import { ManualBookingForm } from '@/components/manual-booking-form';
import type {
  RenterOption,
  RenterPrimaryDriver,
} from '@/components/manual-booking-form/types';
import { db } from '@/lib/db';

type PageSearchParams = Record<string, string | string[] | undefined>;
type RenterLookupRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  companyName: string | null;
  paymentMethod: string | null;
  primaryDriver: unknown;
};

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toOptionalString = (value: unknown) =>
  typeof value === 'string' ? value : null;

const toOptionalBoolean = (value: unknown) =>
  typeof value === 'boolean' ? value : null;

const toRenterPrimaryDriver = (value: unknown): RenterPrimaryDriver | null => {
  if (!isRecord(value)) return null;

  const location = isRecord(value.location)
    ? {
        country: toOptionalString(value.location.country),
        postalCode: toOptionalString(value.location.postalCode),
        city: toOptionalString(value.location.city),
        street: toOptionalString(value.location.street),
        streetType: toOptionalString(value.location.streetType),
        doorNumber: toOptionalString(value.location.doorNumber),
      }
    : null;
  const document = isRecord(value.document)
    ? {
        type: toOptionalString(value.document.type),
        number: toOptionalString(value.document.number),
        validFrom: toOptionalString(value.document.validFrom),
        validUntil: toOptionalString(value.document.validUntil),
        drivingLicenceNumber: toOptionalString(
          value.document.drivingLicenceNumber,
        ),
        drivingLicenceCategory: toOptionalString(
          value.document.drivingLicenceCategory,
        ),
        drivingLicenceValidFrom: toOptionalString(
          value.document.drivingLicenceValidFrom,
        ),
        drivingLicenceValidUntil: toOptionalString(
          value.document.drivingLicenceValidUntil,
        ),
        drivingLicenceIsOlderThan_3: toOptionalBoolean(
          value.document.drivingLicenceIsOlderThan_3,
        ),
      }
    : null;

  return {
    firstName_1: toOptionalString(value.firstName_1),
    firstName_2: toOptionalString(value.firstName_2),
    lastName_1: toOptionalString(value.lastName_1),
    lastName_2: toOptionalString(value.lastName_2),
    phoneNumber: toOptionalString(value.phoneNumber),
    email: toOptionalString(value.email),
    dateOfBirth: toOptionalString(value.dateOfBirth),
    placeOfBirth: toOptionalString(value.placeOfBirth),
    location,
    document,
  };
};

export default async function ManualBookingPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedFleetVehicleId = firstParam(resolvedSearchParams?.vehicleId);
  const requestedRentalStart = firstParam(resolvedSearchParams?.rentalStart);
  const requestedRentalEnd = firstParam(resolvedSearchParams?.rentalEnd);

  const [fleetVehicles, cars, renters] = await Promise.all([
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
    db.$queryRaw<RenterLookupRow[]>`
      SELECT
        "id",
        "name",
        "email",
        "phone",
        "taxId",
        "companyName",
        "paymentMethod",
        "primaryDriver"
      FROM "Renters"
      ORDER BY "name" ASC, "updatedAt" DESC
    `,
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
  const renterOptions: RenterOption[] = renters.map((renter) => ({
    id: renter.id,
    name: renter.name,
    email: renter.email,
    phone: renter.phone,
    taxId: renter.taxId,
    companyName: renter.companyName,
    paymentMethod: renter.paymentMethod,
    primaryDriver: toRenterPrimaryDriver(renter.primaryDriver),
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
          renters={renterOptions}
          initialValues={initialValues}
          lockFleetVehicle={lockFleetVehicle}
        />
      </div>
    </div>
  );
}
