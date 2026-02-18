'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import CarDamages from '@/components/car-damages';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import { FloatingTextarea } from '@/components/ui/textarea';
import { createFleetVehicleAction } from '@/actions/createFleetVehicleAction';
import { updateFleetVehicleDamagesImagesAction } from '@/actions/updateFleetVehicleDamagesImagesAction';
import { updateFleetVehicleAction } from '@/actions/updateFleetVehicleAction';
import {
  DEFAULT_FLEET_PLACE,
  FLEET_PLACES,
  getFleetPlaceLabel,
  getFleetPlaceValue,
  type FleetPlaceLabel,
} from '@/lib/fleet-places';
import {
  FLEET_NOTES_META_PREFIX,
  normalizeFleetServiceWindow,
} from '@/lib/fleet-service-window';

type FleetStatusLabel = 'Elérhető' | 'Kikölcsönözve' | 'Szerviz' | 'Foglalt';
type FleetStatusValue = 'available' | 'rented' | 'reserved' | 'maintenance';

type FleetPlacesOptions = FleetPlaceLabel;
export type FleetEditSection = 'base' | 'service' | 'costs';
type ServiceCostDraft = {
  id: string;
  serviceDate: string;
  serviceFee: string;
};
type ServiceCostStored = {
  serviceDate: string;
  serviceFee: number;
};

const createServiceCostDraft = (
  serviceDate = '',
  serviceFee = '',
): ServiceCostDraft => ({
  id: `cost_${Math.random().toString(36).slice(2, 10)}`,
  serviceDate,
  serviceFee,
});

const parseFleetNotes = (
  raw?: string | null,
): {
  notes: string;
  serviceCosts: ServiceCostDraft[];
  nextServiceFrom: string;
  nextServiceTo: string;
} => {
  if (!raw) {
    return {
      notes: '',
      serviceCosts: [],
      nextServiceFrom: '',
      nextServiceTo: '',
    };
  }
  if (!raw.startsWith(FLEET_NOTES_META_PREFIX)) {
    return {
      notes: raw,
      serviceCosts: [],
      nextServiceFrom: '',
      nextServiceTo: '',
    };
  }

  try {
    const payload = JSON.parse(
      raw.slice(FLEET_NOTES_META_PREFIX.length),
    ) as unknown;
    if (!payload || typeof payload !== 'object') {
      return {
        notes: raw,
        serviceCosts: [],
        nextServiceFrom: '',
        nextServiceTo: '',
      };
    }
    const notes =
      typeof (payload as { notes?: unknown }).notes === 'string'
        ? ((payload as { notes?: string }).notes ?? '')
        : '';
    const parsedWindow = normalizeFleetServiceWindow(
      typeof (payload as { nextServiceFrom?: unknown }).nextServiceFrom ===
        'string'
        ? ((payload as { nextServiceFrom?: string }).nextServiceFrom ?? '')
        : '',
      typeof (payload as { nextServiceTo?: unknown }).nextServiceTo === 'string'
        ? ((payload as { nextServiceTo?: string }).nextServiceTo ?? '')
        : '',
    );
    const incoming = Array.isArray(
      (payload as { serviceCosts?: unknown[] }).serviceCosts,
    )
      ? ((payload as { serviceCosts: unknown[] }).serviceCosts ?? [])
      : [];
    const serviceCosts = incoming
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const serviceDate =
          typeof (entry as { serviceDate?: unknown }).serviceDate === 'string'
            ? ((entry as { serviceDate?: string }).serviceDate ?? '')
            : '';
        const rawFee = (entry as { serviceFee?: unknown }).serviceFee;
        const feeAsNumber =
          typeof rawFee === 'number'
            ? rawFee
            : typeof rawFee === 'string'
              ? Number(rawFee)
              : NaN;
        if (!serviceDate || !Number.isFinite(feeAsNumber)) return null;
        return createServiceCostDraft(serviceDate, String(feeAsNumber));
      })
      .filter((entry): entry is ServiceCostDraft => Boolean(entry));

    return {
      notes,
      serviceCosts,
      nextServiceFrom: parsedWindow.nextServiceFrom,
      nextServiceTo: parsedWindow.nextServiceTo,
    };
  } catch {
    return {
      notes: raw,
      serviceCosts: [],
      nextServiceFrom: '',
      nextServiceTo: '',
    };
  }
};

const serializeFleetNotes = (
  notes: string,
  serviceCosts: ServiceCostStored[],
  nextServiceFrom: string,
  nextServiceTo: string,
): string => {
  const normalizedWindow = normalizeFleetServiceWindow(
    nextServiceFrom,
    nextServiceTo,
  );
  const trimmedNotes = notes.trim();
  if (
    serviceCosts.length === 0 &&
    !normalizedWindow.nextServiceFrom &&
    !normalizedWindow.nextServiceTo
  ) {
    return trimmedNotes;
  }
  return `${FLEET_NOTES_META_PREFIX}${JSON.stringify({
    notes: trimmedNotes,
    serviceCosts,
    nextServiceFrom: normalizedWindow.nextServiceFrom,
    nextServiceTo: normalizedWindow.nextServiceTo,
  })}`;
};

const emptyForm = {
  plate: '',
  odometer: '',
  serviceIntervalKm: '',
  lastServiceMileage: '',
  lastServiceAt: '',
  status: 'Elérhető' as FleetStatusLabel,
  year: '',
  firstRegistration: '',
  location: DEFAULT_FLEET_PLACE as FleetPlacesOptions,
  vin: '',
  engineNumber: '',
  addedAt: '',
  inspectionExpiry: '',
  nextServiceFrom: '',
  nextServiceTo: '',
  notes: '',
  serviceCosts: [] as ServiceCostDraft[],
  damages: '',
  damagesImages: [] as string[],
};

type FleetFormValues = typeof emptyForm;

type FleetAddFormProps = {
  carId: string;
  vehicleId?: string;
  mode?: 'create' | 'edit';
  section?: FleetEditSection;
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
  section,
  initialValues,
}: FleetAddFormProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit';
  const normalizedInitialValues = useMemo<FleetFormValues>(() => {
    const parsedNotes = parseFleetNotes(initialValues?.notes);
    return {
      ...emptyForm,
      ...initialValues,
      status: statusLabelFromInput(initialValues?.status),
      location: locationLabelFromInput(initialValues?.location),
      notes: parsedNotes.notes,
      serviceCosts: parsedNotes.serviceCosts,
      nextServiceFrom: parsedNotes.nextServiceFrom,
      nextServiceTo: parsedNotes.nextServiceTo,
      damagesImages: initialValues?.damagesImages ?? emptyForm.damagesImages,
    };
  }, [initialValues]);
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
      const serviceIntervalValue =
        form.serviceIntervalKm.trim().length > 0
          ? Number(form.serviceIntervalKm)
          : undefined;
      const lastServiceMileageValue =
        form.lastServiceMileage.trim().length > 0
          ? Number(form.lastServiceMileage)
          : undefined;
      const yearValue =
        form.year.trim().length > 0 ? Number(form.year) : undefined;
      const hasIncompleteNextServiceWindow =
        (form.nextServiceFrom.trim().length > 0 &&
          form.nextServiceTo.trim().length === 0) ||
        (form.nextServiceFrom.trim().length === 0 &&
          form.nextServiceTo.trim().length > 0);
      if (hasIncompleteNextServiceWindow) {
        setStatusMessage(
          'A következő szerviznél a "tól" és "ig" dátumot együtt add meg.',
        );
        return;
      }
      const normalizedNextServiceWindow = normalizeFleetServiceWindow(
        form.nextServiceFrom,
        form.nextServiceTo,
      );
      const hasIncompleteServiceCost = form.serviceCosts.some((entry) => {
        const hasDate = entry.serviceDate.trim().length > 0;
        const hasFee = entry.serviceFee.trim().length > 0;
        return hasDate !== hasFee;
      });
      if (hasIncompleteServiceCost) {
        setStatusMessage(
          'Minden szerviz költség tételnél add meg a dátumot és a díjat is.',
        );
        return;
      }
      const hasInvalidServiceCostFee = form.serviceCosts.some(
        (entry) =>
          entry.serviceFee.trim().length > 0 &&
          !Number.isFinite(Number(entry.serviceFee)),
      );
      if (hasInvalidServiceCostFee) {
        setStatusMessage('A szerviz díj mezőben csak szám szerepelhet.');
        return;
      }
      const normalizedServiceCosts = form.serviceCosts
        .map((entry) => ({
          serviceDate: entry.serviceDate.trim(),
          serviceFee:
            entry.serviceFee.trim().length > 0 ? Number(entry.serviceFee) : NaN,
        }))
        .filter(
          (entry) => entry.serviceDate && Number.isFinite(entry.serviceFee),
        ) as ServiceCostStored[];

      const status =
        statusOptions.find((opt) => opt.label === form.status)?.value ??
        'available';

      const payload = {
        carId,
        plate: form.plate,
        odometer: odometerValue,
        serviceIntervalKm: serviceIntervalValue,
        lastServiceMileage: lastServiceMileageValue,
        lastServiceAt: form.lastServiceAt,
        status,
        year: yearValue,
        firstRegistration: form.firstRegistration,
        location: getFleetPlaceValue(form.location),
        vin: form.vin,
        engineNumber: form.engineNumber,
        addedAt: form.addedAt,
        inspectionExpiry: form.inspectionExpiry,
        notes: serializeFleetNotes(
          form.notes,
          normalizedServiceCosts,
          normalizedNextServiceWindow.nextServiceFrom,
          normalizedNextServiceWindow.nextServiceTo,
        ),
        damages: form.damages,
        damagesImages: form.damagesImages,
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
      if (result?.id) {
        router.push(`/cars/${carId}/edit/fleet/${result.id}`);
        return;
      }
      setForm(emptyForm);
      redirectToEditPage();
    });
  };

  const title = isEditMode
    ? section === 'base'
      ? 'Alapadatok módosítása'
      : section === 'service'
        ? 'Szerviz adatok módosítása'
        : section === 'costs'
          ? 'Szerviz költségek módosítása'
          : 'Autó adatainak módosítása'
    : 'Autó felvétele a flottába';
  const submitLabel = isPending
    ? 'Mentés...'
    : isEditMode
      ? section === 'base'
        ? 'Alapadatok mentése'
        : section === 'service'
          ? 'Szerviz adatok mentése'
          : section === 'costs'
            ? 'Költségek mentése'
            : 'Változások mentése'
      : 'Autó hozzáadása';
  const showBasicSection = !section || section === 'base';
  const showServiceSection = !section || section === 'service';
  const showCostsSection = !section || section === 'costs';
  const selectedPlace = placesOptions.find(
    (place) => place.label === form.location,
  );

  return (
    <div className='space-y-4 rounded-xl border bg-card/40 p-6 shadow-sm'>
      <h2 className='text-lg font-semibold'>{title}</h2>
      <form className='grid gap-4 md:grid-cols-2' onSubmit={handleSubmit}>
        {showBasicSection && (
          <>
            <Input
              label='Rendszám'
              value={form.plate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, plate: e.target.value }))
              }
              required
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
            <div className='relative w-full'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='peer h-12 w-full justify-start font-normal'
                  >
                    <span className='inline-flex items-center gap-2'>
                      <span
                        className='h-2.5 w-2.5 rounded-full border border-black/10'
                        style={{
                          backgroundColor: selectedPlace?.color ?? '#888888',
                        }}
                        aria-hidden
                      />
                      <span>{selectedPlace?.label ?? form.location}</span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='start'
                  className='w-[var(--radix-dropdown-menu-trigger-width)]'
                >
                  {placesOptions.map((place) => (
                    <DropdownMenuItem
                      key={place.value}
                      className='cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground'
                      onSelect={() =>
                        setForm((prev) => ({
                          ...prev,
                          location: place.label as FleetPlacesOptions,
                        }))
                      }
                    >
                      <span className='inline-flex items-center gap-2'>
                        <span
                          className='h-2.5 w-2.5 rounded-full border border-black/10'
                          style={{ backgroundColor: place.color }}
                          aria-hidden
                        />
                        <span>{place.label}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <label className='pointer-events-none absolute -top-2 left-3 translate-x-2 bg-background px-2 text-sm text-slate-600'>
                Helyszín
              </label>
            </div>
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
          </>
        )}

        {showServiceSection && (
          <>
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
            <Input
              label='Utolsó szerviz időpontja'
              type='date'
              value={form.lastServiceAt}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, lastServiceAt: e.target.value }))
              }
            />
            <Input
              label='Utolsó szerviz km'
              type='number'
              inputMode='numeric'
              min={0}
              value={form.lastServiceMileage}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  lastServiceMileage: e.target.value,
                }))
              }
            />
            <Input
              label='Szerviz intervallum (km)'
              type='number'
              inputMode='numeric'
              min={0}
              value={form.serviceIntervalKm}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  serviceIntervalKm: e.target.value,
                }))
              }
            />{' '}
            <div className='flex gap-4'>
              <Input
                label='Következő szerviz tól'
                type='date'
                value={form.nextServiceFrom}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nextServiceFrom: e.target.value,
                  }))
                }
              />
              <Input
                label='Következő szerviz ig'
                type='date'
                value={form.nextServiceTo}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nextServiceTo: e.target.value,
                  }))
                }
              />
            </div>
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
            <div className='md:col-span-2'>
              <CarDamages
                carId={carId}
                vehicleId={vehicleId}
                initialImages={form.damagesImages}
                onImagesChange={(images) =>
                  setForm((prev) => ({ ...prev, damagesImages: images }))
                }
                persistImages={async (images) => {
                  if (!vehicleId) return;
                  return updateFleetVehicleDamagesImagesAction({
                    id: vehicleId,
                    carId,
                    damagesImages: images,
                  });
                }}
              />
            </div>
          </>
        )}

        {showCostsSection && (
          <>
            <div className='md:col-span-2 space-y-3 rounded-lg border p-4'>
              <div className='flex items-center justify-between gap-3'>
                <h3 className='text-sm font-semibold'>
                  Szerviz költség tételek
                </h3>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      serviceCosts: [
                        ...prev.serviceCosts,
                        createServiceCostDraft(),
                      ],
                    }))
                  }
                >
                  Új időpont hozzáadása
                </Button>
              </div>

              {form.serviceCosts.length === 0 && (
                <p className='text-sm text-muted-foreground'>
                  Még nincs rögzített szerviz költség.
                </p>
              )}

              {form.serviceCosts.map((entry) => (
                <div
                  key={entry.id}
                  className='grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end'
                >
                  <Input
                    label='Szerviz időpontja'
                    type='date'
                    value={entry.serviceDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        serviceCosts: prev.serviceCosts.map((item) =>
                          item.id === entry.id
                            ? { ...item, serviceDate: e.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                  <Input
                    label='Szerviz díja'
                    type='number'
                    inputMode='decimal'
                    min={0}
                    value={entry.serviceFee}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        serviceCosts: prev.serviceCosts.map((item) =>
                          item.id === entry.id
                            ? { ...item, serviceFee: e.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        serviceCosts: prev.serviceCosts.filter(
                          (item) => item.id !== entry.id,
                        ),
                      }))
                    }
                  >
                    Törlés
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

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
