'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import {
  findFleetVehicleBookingConflict,
  formatDateForConflictMessage,
} from '@/lib/booking-conflicts';
import {
  RENT_STATUS_ACCEPTED,
  RENT_STATUS_CANCELLED,
  RENT_STATUS_FORM_SUBMITTED,
  RENT_STATUS_NEW,
  RENT_STATUS_REGISTERED,
} from '@/lib/constants';
import { db } from '@/lib/db';
import {
  getFleetServiceWindowRangeFromNotes,
  isFleetBlockedByServiceWindow,
} from '@/lib/fleet-service-window';
import { getNextHumanId } from '@/lib/human-id';

type OptionalBooleanInput = boolean | 'true' | 'false' | '' | null | undefined;

type AddressInput = {
  country?: string;
  postalCode?: string;
  city?: string;
  street?: string;
  streetType?: string;
  doorNumber?: string;
};

type ChildInput = {
  age?: string | number | null;
  height?: string | number | null;
};

type DriverInput = {
  firstName_1?: string;
  firstName_2?: string;
  lastName_1?: string;
  lastName_2?: string;
  phoneNumber?: string;
  email?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  location?: AddressInput;
  document?: {
    type?: string;
    number?: string;
    validFrom?: string;
    validUntil?: string;
    drivingLicenceNumber?: string;
    drivingLicenceValidFrom?: string;
    drivingLicenceValidUntil?: string;
    drivingLicenceIsOlderThan_3?: OptionalBooleanInput;
    drivingLicenceCategory?: string;
  };
};

type CreateManualBookingInput = {
  locale?: string;
  status?: string;
  quoteIdentifier?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  rentalStart: string;
  rentalEnd: string;
  rentalDays?: string | number | null;
  fleetVehicleId?: string | null;
  carId?: string;
  carLabel?: string;
  adults?: string | number | null;
  extras?: string[];
  children?: ChildInput[];
  drivers?: DriverInput[];
  contact?: {
    same?: OptionalBooleanInput;
  };
  invoice?: {
    same?: OptionalBooleanInput;
    name?: string;
    phoneNumber?: string;
    email?: string;
    location?: AddressInput;
  };
  delivery?: {
    placeType?: string;
    locationName?: string;
    arrivalFlight?: string;
    departureFlight?: string;
    arrivalHour?: string;
    arrivalMinute?: string;
    address?: AddressInput;
  };
  tax?: {
    id?: string;
    companyName?: string;
  };
  consents?: {
    privacy?: OptionalBooleanInput;
    terms?: OptionalBooleanInput;
    insurance?: OptionalBooleanInput;
    paymentMethod?: string;
  };
  pricing?: {
    rentalFee?: string;
    insurance?: string;
    deposit?: string;
    deliveryFee?: string;
    deliveryLocation?: string;
    extrasFee?: string;
    tip?: string;
  };
  selfServiceEventsJson?: string;
};

type CreateManualBookingResult = {
  success?: string;
  error?: string;
  bookingId?: string;
};

const STATUS_VALUES = new Set<string>([
  RENT_STATUS_NEW,
  RENT_STATUS_FORM_SUBMITTED,
  RENT_STATUS_ACCEPTED,
  RENT_STATUS_REGISTERED,
  RENT_STATUS_CANCELLED,
]);

const PAYMENT_METHOD_VALUES = new Set([
  'advance_transfer',
  'cash_on_pickup',
  'card_on_pickup',
  'instant_transfer_on_pickup',
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const parseIsoDate = (value: string) => new Date(`${value}T00:00:00`);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toOptionalString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const isUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: string }).code === 'P2002';

const isHumanIdUniqueConflict = (error: unknown) => {
  if (!isUniqueConstraintError(error)) return false;
  if (
    typeof error !== 'object' ||
    error === null ||
    !('meta' in error) ||
    !(error as { meta?: unknown }).meta
  ) {
    return false;
  }

  const meta = (error as { meta?: { target?: unknown } }).meta;
  const target = meta?.target;
  if (Array.isArray(target)) {
    return target.includes('humanId');
  }
  if (typeof target === 'string') {
    return target.includes('humanId');
  }
  return false;
};

const toOptionalInteger = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
  }
  return undefined;
};

const toOptionalBoolean = (value: OptionalBooleanInput): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const getInclusiveDays = (start: Date, end: Date) => {
  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
};

const normalizeAddress = (input?: AddressInput) => {
  if (!input) return undefined;

  const normalized = {
    country: toOptionalString(input.country),
    postalCode: toOptionalString(input.postalCode),
    city: toOptionalString(input.city),
    street: toOptionalString(input.street),
    streetType: toOptionalString(input.streetType),
    doorNumber: toOptionalString(input.doorNumber),
  };

  return Object.values(normalized).some((value) => value != null)
    ? normalized
    : undefined;
};

const pruneUndefined = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => pruneUndefined(item))
      .filter((item) => item !== undefined);
    return normalized;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => [key, pruneUndefined(nested)] as const)
      .filter(([, nested]) => nested !== undefined);

    if (entries.length === 0) return undefined;
    return Object.fromEntries(entries);
  }

  return value === undefined ? undefined : value;
};

export async function createManualBookingAction({
  locale,
  status,
  quoteIdentifier,
  contactName,
  contactEmail,
  contactPhone,
  rentalStart,
  rentalEnd,
  rentalDays,
  fleetVehicleId,
  carId,
  carLabel,
  adults,
  extras,
  children,
  drivers,
  contact,
  invoice,
  delivery,
  tax,
  consents,
  pricing,
  selfServiceEventsJson,
}: CreateManualBookingInput): Promise<CreateManualBookingResult> {
  const trimmedName = toOptionalString(contactName);
  const trimmedEmail = toOptionalString(contactEmail);
  const trimmedPhone = toOptionalString(contactPhone);
  const trimmedLocale = toOptionalString(locale) ?? 'hu';
  const trimmedFleetVehicleId = toOptionalString(fleetVehicleId ?? undefined);
  const trimmedCarId = toOptionalString(carId);
  const trimmedCarLabel = toOptionalString(carLabel);
  const trimmedQuoteIdentifier = toOptionalString(quoteIdentifier);
  const trimmedSelfServiceEventsJson = toOptionalString(selfServiceEventsJson);

  if (!trimmedName) {
    return { error: 'A név megadása kötelező.' };
  }

  if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
    return { error: 'Érvényes e-mail cím megadása kötelező.' };
  }

  if (!rentalStart || !rentalEnd) {
    return { error: 'A kezdő és záró dátum kötelező.' };
  }

  if (!isIsoDate(rentalStart) || !isIsoDate(rentalEnd)) {
    return { error: 'Érvénytelen dátumformátum.' };
  }

  const parsedStart = parseIsoDate(rentalStart);
  const parsedEnd = parseIsoDate(rentalEnd);
  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
    return { error: 'Érvénytelen dátum.' };
  }

  if (parsedEnd < parsedStart) {
    return { error: 'A záró dátum nem lehet a kezdő dátum előtt.' };
  }

  let linkedQuoteId: string | null = null;
  if (trimmedQuoteIdentifier) {
    const linkedQuote = UUID_PATTERN.test(trimmedQuoteIdentifier)
      ? await db.contactQuotes.findUnique({
          where: { id: trimmedQuoteIdentifier },
          select: { id: true },
        })
      : await db.contactQuotes.findUnique({
          where: { humanId: trimmedQuoteIdentifier },
          select: { id: true },
        });

    if (!linkedQuote) {
      return {
        error:
          'A megadott ajánlatazonosítóhoz nem található ajánlatkérés (id vagy humanId).',
      };
    }

    linkedQuoteId = linkedQuote.id;
  }

  let selectedFleet:
    | { id: string; carId: string; plate: string; notes: string | null }
    | null = null;

  if (trimmedFleetVehicleId) {
    selectedFleet = await db.fleetVehicle.findUnique({
      where: { id: trimmedFleetVehicleId },
      select: { id: true, carId: true, plate: true, notes: true },
    });

    if (!selectedFleet) {
      return { error: 'A választott flotta autó nem található.' };
    }

    if (
      isFleetBlockedByServiceWindow({
        notes: selectedFleet.notes,
        rentalStart: parsedStart,
        rentalEnd: parsedEnd,
      })
    ) {
      const window = getFleetServiceWindowRangeFromNotes(selectedFleet.notes);
      return {
        error: `A kiválasztott autó szerviz alatt áll ebben az időszakban (${window?.fromLabel ?? '-'} - ${window?.toLabel ?? '-'}).`,
      };
    }

    const conflictingBooking = await findFleetVehicleBookingConflict({
      bookingIdToExclude: undefined,
      fleetVehicleId: selectedFleet.id,
      rentalStart: parsedStart,
      rentalEnd: parsedEnd,
    });

    if (conflictingBooking) {
      const conflictLabel = conflictingBooking.humanId ?? conflictingBooking.id;
      const conflictStart = formatDateForConflictMessage(
        conflictingBooking.rentalstart,
      );
      const conflictEnd = formatDateForConflictMessage(
        conflictingBooking.rentalend,
      );
      return {
        error: `A kiválasztott autó már foglalt ebben az időszakban (${conflictLabel}: ${conflictStart} - ${conflictEnd}).`,
      };
    }
  }

  const normalizedStatus = toOptionalString(status);
  if (normalizedStatus && !STATUS_VALUES.has(normalizedStatus)) {
    return { error: 'Érvénytelen foglalási állapot.' };
  }

  const effectiveStatus =
    normalizedStatus ??
    (selectedFleet ? RENT_STATUS_REGISTERED : RENT_STATUS_ACCEPTED);

  if (trimmedSelfServiceEventsJson) {
    try {
      JSON.parse(trimmedSelfServiceEventsJson);
    } catch {
      return {
        error:
          'Az önkiszolgáló módosítások mezőben csak érvényes JSON adható meg.',
      };
    }
  }

  const effectiveRentalDays =
    toOptionalInteger(rentalDays) ?? getInclusiveDays(parsedStart, parsedEnd);

  if (effectiveRentalDays <= 0) {
    return { error: 'A bérelt napok száma csak pozitív szám lehet.' };
  }

  const normalizedAdults = toOptionalInteger(adults);
  if (normalizedAdults != null && normalizedAdults < 0) {
    return { error: 'A felnőttek száma nem lehet negatív.' };
  }

  const normalizedExtras =
    extras
      ?.map((item) => toOptionalString(item))
      .filter((item): item is string => Boolean(item)) ?? [];

  const normalizedChildren =
    children
      ?.map((child) => ({
        age: toOptionalInteger(child.age),
        height: toOptionalInteger(child.height),
      }))
      .filter((child) => child.age != null || child.height != null) ?? [];

  const normalizedDrivers =
    drivers
      ?.map((driver) => {
        const normalizedLocation = normalizeAddress(driver.location);
        const normalizedDocument = {
          type: toOptionalString(driver.document?.type),
          number: toOptionalString(driver.document?.number),
          validFrom: toOptionalString(driver.document?.validFrom),
          validUntil: toOptionalString(driver.document?.validUntil),
          drivingLicenceNumber: toOptionalString(
            driver.document?.drivingLicenceNumber,
          ),
          drivingLicenceValidFrom: toOptionalString(
            driver.document?.drivingLicenceValidFrom,
          ),
          drivingLicenceValidUntil: toOptionalString(
            driver.document?.drivingLicenceValidUntil,
          ),
          drivingLicenceIsOlderThan_3: toOptionalBoolean(
            driver.document?.drivingLicenceIsOlderThan_3,
          ),
          drivingLicenceCategory: toOptionalString(
            driver.document?.drivingLicenceCategory,
          ),
        };

        const hasDocumentData = Object.values(normalizedDocument).some(
          (value) => value != null,
        );

        const normalizedDriver = {
          firstName_1: toOptionalString(driver.firstName_1),
          firstName_2: toOptionalString(driver.firstName_2),
          lastName_1: toOptionalString(driver.lastName_1),
          lastName_2: toOptionalString(driver.lastName_2),
          phoneNumber: toOptionalString(driver.phoneNumber),
          email: toOptionalString(driver.email),
          dateOfBirth: toOptionalString(driver.dateOfBirth),
          placeOfBirth: toOptionalString(driver.placeOfBirth),
          location: normalizedLocation,
          document: hasDocumentData ? normalizedDocument : undefined,
        };

        return Object.values(normalizedDriver).some((value) => value != null)
          ? normalizedDriver
          : null;
      })
      .filter((driver): driver is NonNullable<typeof driver> => Boolean(driver)) ??
    [];

  const normalizedPaymentMethod = toOptionalString(consents?.paymentMethod);
  if (
    normalizedPaymentMethod &&
    !PAYMENT_METHOD_VALUES.has(normalizedPaymentMethod)
  ) {
    return { error: 'Érvénytelen fizetési mód.' };
  }

  const normalizedConsents = {
    privacy: toOptionalBoolean(consents?.privacy),
    terms: toOptionalBoolean(consents?.terms),
    insurance: toOptionalBoolean(consents?.insurance),
    paymentMethod: normalizedPaymentMethod,
  };

  const normalizedPricing = {
    rentalFee: toOptionalString(pricing?.rentalFee),
    insurance: toOptionalString(pricing?.insurance),
    deposit: toOptionalString(pricing?.deposit),
    deliveryFee: toOptionalString(pricing?.deliveryFee),
    deliveryLocation: toOptionalString(pricing?.deliveryLocation),
    extrasFee: toOptionalString(pricing?.extrasFee),
    tip: toOptionalString(pricing?.tip),
  };

  const normalizedInvoice = {
    same: toOptionalBoolean(invoice?.same),
    name: toOptionalString(invoice?.name),
    phoneNumber: toOptionalString(invoice?.phoneNumber),
    email: toOptionalString(invoice?.email),
    location: normalizeAddress(invoice?.location),
  };

  const normalizedDelivery = {
    placeType: toOptionalString(delivery?.placeType),
    locationName: toOptionalString(delivery?.locationName),
    arrivalFlight: toOptionalString(delivery?.arrivalFlight),
    departureFlight: toOptionalString(delivery?.departureFlight),
    arrivalHour: toOptionalString(delivery?.arrivalHour),
    arrivalMinute: toOptionalString(delivery?.arrivalMinute),
    address: normalizeAddress(delivery?.address),
  };

  const normalizedTax = {
    id: toOptionalString(tax?.id),
    companyName: toOptionalString(tax?.companyName),
  };

  const payload: Record<string, unknown> = {
    locale: trimmedLocale,
    rentalPeriod: {
      startDate: rentalStart,
      endDate: rentalEnd,
    },
    contact: {
      same: toOptionalBoolean(contact?.same),
      name: trimmedName,
      email: trimmedEmail,
    },
  };

  if (linkedQuoteId) {
    payload.quoteId = linkedQuoteId;
  }

  if (selectedFleet) {
    payload.carId = selectedFleet.carId;
    payload.assignedFleetVehicleId = selectedFleet.id;
    payload.assignedFleetPlate = selectedFleet.plate;
  } else if (trimmedCarId) {
    payload.carId = trimmedCarId;
  } else if (trimmedCarLabel) {
    payload.carId = trimmedCarLabel;
  }

  if (normalizedExtras.length > 0) {
    payload.extras = normalizedExtras;
  }

  if (normalizedAdults != null) {
    payload.adults = normalizedAdults;
  }

  if (normalizedChildren.length > 0) {
    payload.children = normalizedChildren;
  }

  if (normalizedDrivers.length > 0) {
    payload.driver = normalizedDrivers;
  }

  if (
    Object.values(normalizedInvoice).some((value) => value != null)
  ) {
    payload.invoice = normalizedInvoice;
  }

  if (
    Object.values(normalizedDelivery).some((value) => value != null)
  ) {
    payload.delivery = normalizedDelivery;
  }

  if (Object.values(normalizedTax).some((value) => value != null)) {
    payload.tax = normalizedTax;
  }

  if (Object.values(normalizedConsents).some((value) => value != null)) {
    payload.consents = normalizedConsents;
  }

  if (Object.values(normalizedPricing).some((value) => value != null)) {
    payload.pricing = normalizedPricing;
  }

  const sanitizedPayload = pruneUndefined(payload);
  if (!sanitizedPayload || typeof sanitizedPayload !== 'object') {
    return { error: 'A foglalás payload összeállítása sikertelen.' };
  }

  try {
    let created: { id: string } | null = null;
    let attempts = 0;

    while (!created) {
      const nextHumanId = await getNextHumanId('RentRequests');

      try {
        created = await db.rentRequests.create({
          data: {
            locale: trimmedLocale,
            carid: selectedFleet?.carId ?? trimmedCarId ?? null,
            quoteid: linkedQuoteId,
            contactname: trimmedName,
            contactemail: trimmedEmail,
            contactphone: trimmedPhone ?? null,
            rentalstart: parsedStart,
            rentalend: parsedEnd,
            rentaldays: effectiveRentalDays,
            status: effectiveStatus,
            updated: trimmedSelfServiceEventsJson ?? null,
            payload: sanitizedPayload as Prisma.InputJsonValue,
            humanId: nextHumanId ?? undefined,
          },
          select: { id: true },
        });
      } catch (error) {
        if (isHumanIdUniqueConflict(error) && attempts < 5) {
          attempts += 1;
          continue;
        }
        throw error;
      }
    }

    revalidatePath('/');
    revalidatePath('/calendar');

    return {
      success: 'Foglalás sikeresen létrehozva.',
      bookingId: created.id,
    };
  } catch (error) {
    console.error('createManualBookingAction', error);
    return { error: 'A foglalás mentése közben hiba történt.' };
  }
}
