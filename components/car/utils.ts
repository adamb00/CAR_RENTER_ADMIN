export const normalizeImages = (images: string[]) =>
  Array.from(new Set(images.filter(Boolean)));

export const areImagesEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

import {
  DEFAULT_FLEET_PLACE,
  FLEET_PLACES,
  getFleetPlaceLabel,
  getFleetPlaceValue,
} from '@/lib/fleet-places';
import {
  FLEET_NOTES_META_PREFIX,
  normalizeFleetServiceWindow,
} from '@/lib/fleet-service-window';

import {
  emptyFleetForm,
  type FleetAddFormProps,
  type FleetEditSection,
  type FleetFormValues,
  type FleetPlacesOptions,
  type FleetStatusLabel,
  type FleetStatusValue,
  type ServiceCostDraft,
  type ServiceCostStored,
} from './types';

export const statusOptions: {
  value: FleetStatusValue;
  label: FleetStatusLabel;
}[] = [
  { value: 'available', label: 'Elérhető' },
  { value: 'rented', label: 'Kikölcsönözve' },
  { value: 'reserved', label: 'Foglalt' },
  { value: 'maintenance', label: 'Szerviz' },
];

export const placesOptions = FLEET_PLACES;

export const createServiceCostDraft = (
  serviceDate = '',
  serviceFee = '',
  note = '',
): ServiceCostDraft => ({
  id: `cost_${Math.random().toString(36).slice(2, 10)}`,
  serviceDate,
  serviceFee,
  note,
});

export const parseFleetNotes = (
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
        const note =
          typeof (entry as { note?: unknown }).note === 'string'
            ? ((entry as { note?: string }).note ?? '')
            : '';
        const feeAsNumber =
          typeof rawFee === 'number'
            ? rawFee
            : typeof rawFee === 'string'
              ? Number(rawFee)
              : NaN;
        if (!serviceDate || !Number.isFinite(feeAsNumber)) return null;
        return createServiceCostDraft(serviceDate, String(feeAsNumber), note);
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

export const serializeFleetNotes = (
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

export const statusLabelFromInput = (
  status?: FleetStatusLabel | FleetStatusValue,
): FleetStatusLabel => {
  const fromValue = statusOptions.find((opt) => opt.value === status)?.label;
  if (fromValue) return fromValue;
  const fromLabel = statusOptions.find((opt) => opt.label === status)?.label;
  return (fromLabel ?? 'Elérhető') as FleetStatusLabel;
};

export const locationLabelFromInput = (
  location?: FleetPlacesOptions | string,
): FleetPlacesOptions => {
  if (!location) return DEFAULT_FLEET_PLACE as FleetPlacesOptions;
  const label = getFleetPlaceLabel(location);
  const fromLabel = placesOptions.find((opt) => opt.label === label)?.label;
  return (fromLabel ?? DEFAULT_FLEET_PLACE) as FleetPlacesOptions;
};

export const normalizeFleetFormInitialValues = (
  initialValues?: FleetAddFormProps['initialValues'],
): FleetFormValues => {
  const parsedNotes = parseFleetNotes(initialValues?.notes);
  return {
    ...emptyFleetForm,
    ...initialValues,
    status: statusLabelFromInput(initialValues?.status),
    location: locationLabelFromInput(initialValues?.location),
    notes: parsedNotes.notes,
    serviceCosts: parsedNotes.serviceCosts,
    nextServiceFrom: parsedNotes.nextServiceFrom,
    nextServiceTo: parsedNotes.nextServiceTo,
    damagesImages: initialValues?.damagesImages ?? emptyFleetForm.damagesImages,
  };
};

const toOptionalNumber = (value: string) =>
  value.trim().length > 0 ? Number(value) : undefined;

export const buildFleetFormSubmission = (
  form: FleetFormValues,
  carId: string,
):
  | {
      error: string;
    }
  | {
      payload: {
        carId: string;
        plate: string;
        odometer?: number;
        serviceIntervalKm?: number;
        lastServiceMileage?: number;
        lastServiceAt: string;
        status: FleetStatusValue;
        year?: number;
        firstRegistration: string;
        location: string;
        vin: string;
        engineNumber: string;
        addedAt: string;
        inspectionExpiry: string;
        notes: string;
        damages: string;
        damagesImages: string[];
      };
    } => {
  const hasIncompleteNextServiceWindow =
    (form.nextServiceFrom.trim().length > 0 &&
      form.nextServiceTo.trim().length === 0) ||
    (form.nextServiceFrom.trim().length === 0 &&
      form.nextServiceTo.trim().length > 0);
  if (hasIncompleteNextServiceWindow) {
    return {
      error: 'A következő szerviznél a "tól" és "ig" dátumot együtt add meg.',
    };
  }

  const hasIncompleteServiceCost = form.serviceCosts.some((entry) => {
    const hasDate = entry.serviceDate.trim().length > 0;
    const hasFee = entry.serviceFee.trim().length > 0;
    return hasDate !== hasFee;
  });
  if (hasIncompleteServiceCost) {
    return {
      error: 'Minden szerviz költség tételnél add meg a dátumot és a díjat is.',
    };
  }

  const hasInvalidServiceCostFee = form.serviceCosts.some(
    (entry) =>
      entry.serviceFee.trim().length > 0 &&
      !Number.isFinite(Number(entry.serviceFee)),
  );
  if (hasInvalidServiceCostFee) {
    return {
      error: 'A szerviz díj mezőben csak szám szerepelhet.',
    };
  }

  const normalizedNextServiceWindow = normalizeFleetServiceWindow(
    form.nextServiceFrom,
    form.nextServiceTo,
  );
  const normalizedServiceCosts = form.serviceCosts
    .map((entry) => ({
      serviceDate: entry.serviceDate.trim(),
      serviceFee:
        entry.serviceFee.trim().length > 0 ? Number(entry.serviceFee) : NaN,
      note: entry.note.trim() || undefined,
    }))
    .filter(
      (entry) => entry.serviceDate && Number.isFinite(entry.serviceFee),
    ) as ServiceCostStored[];

  const status =
    statusOptions.find((opt) => opt.label === form.status)?.value ??
    'available';

  return {
    payload: {
      carId,
      plate: form.plate,
      odometer: toOptionalNumber(form.odometer),
      serviceIntervalKm: toOptionalNumber(form.serviceIntervalKm),
      lastServiceMileage: toOptionalNumber(form.lastServiceMileage),
      lastServiceAt: form.lastServiceAt,
      status,
      year: toOptionalNumber(form.year),
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
    },
  };
};

export const getFleetFormTitle = (
  isEditMode: boolean,
  section?: FleetEditSection,
) => {
  if (!isEditMode) return 'Autó felvétele a flottába';
  if (section === 'base') return 'Alapadatok módosítása';
  if (section === 'service') return 'Szerviz adatok módosítása';
  if (section === 'costs') return 'Szerviz költségek módosítása';
  return 'Autó adatainak módosítása';
};

export const getFleetFormSubmitLabel = (
  isPending: boolean,
  isEditMode: boolean,
  section?: FleetEditSection,
) => {
  if (isPending) return 'Mentés...';
  if (!isEditMode) return 'Autó hozzáadása';
  if (section === 'base') return 'Alapadatok mentése';
  if (section === 'service') return 'Szerviz adatok mentése';
  if (section === 'costs') return 'Költségek mentése';
  return 'Változások mentése';
};
