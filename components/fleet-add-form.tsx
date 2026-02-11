'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import { FloatingTextarea } from '@/components/ui/textarea';
import { createFleetVehicleAction } from '@/actions/createFleetVehicleAction';
import { updateFleetVehicleAction } from '@/actions/updateFleetVehicleAction';
import {
  DEFAULT_FLEET_PLACE,
  FLEET_PLACES,
  getFleetPlaceLabel,
  getFleetPlaceValue,
  type FleetPlaceLabel,
} from '@/lib/fleet-places';

type FleetStatusLabel = 'Elérhető' | 'Kikölcsönözve' | 'Szerviz' | 'Foglalt';
type FleetStatusValue = 'available' | 'rented' | 'reserved' | 'maintenance';

type FleetPlacesOptions = FleetPlaceLabel;

const emptyForm = {
  plate: '',
  odometer: '',
  status: 'Elérhető' as FleetStatusLabel,
  year: '',
  firstRegistration: '',
  location: DEFAULT_FLEET_PLACE as FleetPlacesOptions,
  vin: '',
  engineNumber: '',
  addedAt: '',
  inspectionExpiry: '',
  notes: '',
  damages: '',
};

type FleetFormValues = typeof emptyForm;

type FleetAddFormProps = {
  carId: string;
  vehicleId?: string;
  mode?: 'create' | 'edit';
  initialValues?: Partial<Omit<FleetFormValues, 'status' | 'location'>> & {
    status?: FleetFormValues['status'] | FleetStatusValue;
    location?: FleetFormValues['location'] | FleetPlacesOptions | string;
  };
};

const statusOptions: { value: FleetStatusValue; label: FleetStatusLabel }[] = [
  { value: 'available', label: 'Elérhető' },
  { value: 'rented', label: 'Kikölcsönözve' },
  { value: 'reserved', label: 'Foglalt' },
  { value: 'maintenance', label: 'Szerviz' },
];

const placesOptions = FLEET_PLACES;

const statusLabelFromInput = (
  status?: FleetStatusLabel | FleetStatusValue,
): FleetStatusLabel => {
  const fromValue = statusOptions.find((opt) => opt.value === status)?.label;
  if (fromValue) return fromValue;
  const fromLabel = statusOptions.find((opt) => opt.label === status)?.label;
  return (fromLabel ?? 'elérhető') as FleetStatusLabel;
};

const locationLabelFromInput = (
  location?: FleetPlacesOptions | string,
): FleetPlacesOptions => {
  if (!location) return DEFAULT_FLEET_PLACE as FleetPlacesOptions;
  const label = getFleetPlaceLabel(location);
  const fromLabel = placesOptions.find((opt) => opt.label === label)?.label;
  return (fromLabel ?? DEFAULT_FLEET_PLACE) as FleetPlacesOptions;
};

export function FleetAddForm({
  carId,
  vehicleId,
  mode = 'create',
  initialValues,
}: FleetAddFormProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit';
  const normalizedInitialValues = useMemo<FleetFormValues>(
    () => ({
      ...emptyForm,
      ...initialValues,
      status: statusLabelFromInput(initialValues?.status),
      location: locationLabelFromInput(initialValues?.location),
    }),
    [initialValues],
  );
  const [form, setForm] = useState<FleetFormValues>(normalizedInitialValues);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(normalizedInitialValues);
    setStatusMessage(null);
  }, [normalizedInitialValues]);

  const redirectToEditPage = () => {
    router.push(`/cars/${carId}/edit`);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEditMode && !vehicleId) {
      setStatusMessage('Hiányzik a flottajármű azonosítója.');
      return;
    }
    startTransition(async () => {
      const odometerValue =
        form.odometer.trim().length > 0 ? Number(form.odometer) : undefined;
      const yearValue =
        form.year.trim().length > 0 ? Number(form.year) : undefined;

      const status =
        statusOptions.find((opt) => opt.label === form.status)?.value ??
        'available';

      const payload = {
        carId,
        plate: form.plate,
        odometer: odometerValue,
        status,
        year: yearValue,
        firstRegistration: form.firstRegistration,
        location: getFleetPlaceValue(form.location),
        vin: form.vin,
        engineNumber: form.engineNumber,
        addedAt: form.addedAt,
        inspectionExpiry: form.inspectionExpiry,
        notes: form.notes,
        damages: form.damages,
      };

      const result = isEditMode
        ? await updateFleetVehicleAction({
            id: vehicleId as string,
            ...payload,
          })
        : await createFleetVehicleAction(payload);

      if (result?.error) {
        setStatusMessage(result.error);
        return;
      }

      setStatusMessage(
        result?.success ??
          (isEditMode
            ? 'Az autó adatai frissítve.'
            : 'Autó hozzáadva a flottához.'),
      );
      if (isEditMode) {
        redirectToEditPage();
        return;
      }
      setForm(emptyForm);
      redirectToEditPage();
    });
  };

  const title = isEditMode
    ? 'Autó adatainak módosítása'
    : 'Autó felvétele a flottába';
  const submitLabel = isPending
    ? 'Mentés...'
    : isEditMode
      ? 'Változások mentése'
      : 'Autó hozzáadása';

  return (
    <div className='space-y-4 rounded-xl border bg-card/40 p-6 shadow-sm'>
      <h2 className='text-lg font-semibold'>{title}</h2>
      <form className='grid gap-4 md:grid-cols-2' onSubmit={handleSubmit}>
        <Input
          label='Rendszám'
          value={form.plate}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, plate: e.target.value }))
          }
          required
        />
        <Input
          label='Km óra'
          type='number'
          inputMode='numeric'
          min={0}
          value={form.odometer}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, odometer: e.target.value }))
          }
        />
        <Input
          label='Évjárat'
          value={form.year}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, year: e.target.value }))
          }
        />
        <FloatingSelect
          label='Státusz'
          value={
            statusOptions.find((opt) => opt.label === form.status)?.value ??
            'available'
          }
          onChange={(e) => {
            const selected = statusOptions.find(
              (opt) => opt.value === e.target.value,
            );
            setForm((prev) => ({
              ...prev,
              status: (selected?.label ?? 'elérhető') as FleetStatusLabel,
            }));
          }}
        >
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </FloatingSelect>
        <Input
          label='Első forgalomba helyezés'
          type='date'
          value={form.firstRegistration}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              firstRegistration: e.target.value,
            }))
          }
        />
        <Input
          label='Flottába vétel dátuma'
          type='date'
          value={form.addedAt}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, addedAt: e.target.value }))
          }
        />
        <Input
          label='Műszaki vizsga lejárata'
          type='date'
          value={form.inspectionExpiry}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              inspectionExpiry: e.target.value,
            }))
          }
        />
        <FloatingSelect
          label='Helyszín'
          value={getFleetPlaceValue(form.location)}
          onChange={(e) => {
            const selected = placesOptions.find(
              (opt) => opt.value === e.target.value,
            );
            setForm((prev) => ({
              ...prev,
              location: (selected?.label ??
                locationLabelFromInput(e.target.value)) as FleetPlacesOptions,
            }));
          }}
        >
          {placesOptions.map((place) => (
            <option key={place.value} value={place.value}>
              {place.label}
            </option>
          ))}
        </FloatingSelect>
        <Input
          label='Alvázszám'
          value={form.vin}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, vin: e.target.value }))
          }
        />
        <Input
          label='Motorszám'
          value={form.engineNumber}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, engineNumber: e.target.value }))
          }
        />
        <div className='md:col-span-2 space-y-2'>
          <FloatingTextarea
            label='Megjegyzések'
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </div>
        <div className='md:col-span-2 space-y-2'>
          <FloatingTextarea
            label='Ismert sérülések'
            value={form.damages}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, damages: e.target.value }))
            }
          />
        </div>
        <div className='md:col-span-2 flex items-center justify-end gap-3'>
          <Button
            type='button'
            variant='secondary'
            onClick={redirectToEditPage}
            disabled={isPending}
          >
            Mégse
          </Button>
          <Button type='submit' disabled={isPending}>
            {submitLabel}
          </Button>
        </div>
      </form>
      {statusMessage && (
        <p className='text-sm text-muted-foreground'>{statusMessage}</p>
      )}
    </div>
  );
}
