'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import {
  RENT_STATUS_ACCEPTED,
  RENT_STATUS_CANCELLED,
  RENT_STATUS_FORM_SUBMITTED,
  RENT_STATUS_NEW,
  RENT_STATUS_REGISTERED,
} from '@/lib/constants';
import { db } from '@/lib/db';
import {
  DELIVERY_ISLAND_FUERTEVENTURA,
  DELIVERY_ISLAND_LANZAROTE,
  resolveDeliveryIsland,
} from '@/lib/delivery-island';
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
  contactEmail?: string;
  contactPhone?: string;
  rentalStart?: string;
  rentalEnd?: string;
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
    island?: string;
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

const toOptionalString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const toOptionalDate = (value?: string | null): Date | null => {
  const trimmed = toOptionalString(value);
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [yearText, monthText, dayText] = trimmed.split('-');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed;
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

const normalizeDeliveryIsland = (value?: string) => {
  const normalized = toOptionalString(value)?.toLowerCase();
  if (normalized === DELIVERY_ISLAND_LANZAROTE.toLowerCase()) {
    return DELIVERY_ISLAND_LANZAROTE;
  }
  if (normalized === DELIVERY_ISLAND_FUERTEVENTURA.toLowerCase()) {
    return DELIVERY_ISLAND_FUERTEVENTURA;
  }
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

const toAddressLine = (
  address?: ReturnType<typeof normalizeAddress>,
): string | undefined => {
  if (!address) return undefined;

  const locality = [address.postalCode, address.city]
    .filter((value): value is string => Boolean(value))
    .join(' ');
  const street = [address.street, address.streetType, address.doorNumber]
    .filter((value): value is string => Boolean(value))
    .join(' ');

  const line = [locality, street, address.country]
    .filter((value): value is string => Boolean(value))
    .join(', ');

  return line.length > 0 ? line : undefined;
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
  const effectiveContactName = trimmedName ?? 'Ismeretlen';
  const trimmedEmail = toOptionalString(contactEmail);
  const trimmedPhone = toOptionalString(contactPhone);
  const trimmedLocale = toOptionalString(locale) ?? 'hu';
  const trimmedRentalStart = toOptionalString(rentalStart);
  const trimmedRentalEnd = toOptionalString(rentalEnd);
  const trimmedFleetVehicleId = toOptionalString(fleetVehicleId ?? undefined);
  const trimmedCarId = toOptionalString(carId);
  const trimmedQuoteIdentifier = toOptionalString(quoteIdentifier);
  const trimmedSelfServiceEventsJson = toOptionalString(selfServiceEventsJson);

  const parsedStart = toOptionalDate(trimmedRentalStart);
  const parsedEnd = toOptionalDate(trimmedRentalEnd);

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
    linkedQuoteId = linkedQuote?.id ?? null;
  }

  let selectedFleet:
    | { id: string; carId: string; plate: string; notes: string | null }
    | null = null;

  if (trimmedFleetVehicleId) {
    selectedFleet = await db.fleetVehicle.findUnique({
      where: { id: trimmedFleetVehicleId },
      select: { id: true, carId: true, plate: true, notes: true },
    });
  }

  const requestedStatus = toOptionalString(status);
  const normalizedStatus =
    requestedStatus && STATUS_VALUES.has(requestedStatus)
      ? requestedStatus
      : undefined;

  const effectiveStatus =
    selectedFleet
      ? RENT_STATUS_REGISTERED
      : (normalizedStatus ?? RENT_STATUS_ACCEPTED);

  const normalizedRentalDays = toOptionalInteger(rentalDays);
  const effectiveRentalDays =
    normalizedRentalDays != null && normalizedRentalDays > 0
      ? normalizedRentalDays
      : normalizedRentalDays == null && parsedStart && parsedEnd
        ? getInclusiveDays(parsedStart, parsedEnd)
        : undefined;

  const normalizedAdults = toOptionalInteger(adults);
  const effectiveAdults =
    normalizedAdults != null && normalizedAdults >= 0 ? normalizedAdults : undefined;

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
  const effectivePaymentMethod =
    normalizedPaymentMethod && PAYMENT_METHOD_VALUES.has(normalizedPaymentMethod)
      ? normalizedPaymentMethod
      : undefined;

  const normalizedConsents = {
    privacy: toOptionalBoolean(consents?.privacy),
    terms: toOptionalBoolean(consents?.terms),
    insurance: toOptionalBoolean(consents?.insurance),
    paymentMethod: effectivePaymentMethod,
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

  const normalizedDeliveryAddress = normalizeAddress(delivery?.address);
  const normalizedDeliveryLocationName =
    toOptionalString(delivery?.locationName) ??
    normalizedPricing.deliveryLocation;
  const normalizedDeliveryAddressLine = toAddressLine(normalizedDeliveryAddress);
  const deliveryAddressLineForIsland = [
    normalizedDeliveryAddressLine,
    normalizedDeliveryAddress?.street,
    normalizedDeliveryAddress?.city,
    normalizedDeliveryAddress?.country,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ');

  const normalizedDelivery = {
    placeType: toOptionalString(delivery?.placeType),
    island:
      normalizeDeliveryIsland(delivery?.island) ??
      resolveDeliveryIsland({
        locationName: normalizedDeliveryLocationName ?? null,
        addressLine: deliveryAddressLineForIsland || null,
        arrivalFlight: toOptionalString(delivery?.arrivalFlight) ?? null,
        departureFlight: toOptionalString(delivery?.departureFlight) ?? null,
      }) ??
      undefined,
    locationName: normalizedDeliveryLocationName,
    arrivalFlight: toOptionalString(delivery?.arrivalFlight),
    departureFlight: toOptionalString(delivery?.departureFlight),
    arrivalHour: toOptionalString(delivery?.arrivalHour),
    arrivalMinute: toOptionalString(delivery?.arrivalMinute),
    addressLine: normalizedDeliveryAddressLine,
  };

  const normalizedTax = {
    id: toOptionalString(tax?.id),
    companyName: toOptionalString(tax?.companyName),
  };

  const payload: Record<string, unknown> = {};
  const normalizedContactSame = toOptionalBoolean(contact?.same);

  if (normalizedContactSame != null) {
    payload.contact = { same: normalizedContactSame };
  }

  if (normalizedExtras.length > 0) {
    payload.extras = normalizedExtras;
  }

  if (effectiveAdults != null) {
    payload.adults = effectiveAdults;
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

  if (Object.values(normalizedTax).some((value) => value != null)) {
    payload.tax = normalizedTax;
  }

  if (Object.values(normalizedConsents).some((value) => value != null)) {
    payload.consents = normalizedConsents;
  }

  const sanitizedPayload = pruneUndefined(payload);
  const payloadForStorage =
    sanitizedPayload && typeof sanitizedPayload === 'object'
      ? (sanitizedPayload as Prisma.InputJsonValue)
      : Prisma.DbNull;

  const pricingSnapshotData = {
    rentalFee: normalizedPricing.rentalFee ?? null,
    insurance: normalizedPricing.insurance ?? null,
    deposit: normalizedPricing.deposit ?? null,
    deliveryFee: normalizedPricing.deliveryFee ?? null,
    extrasFee: normalizedPricing.extrasFee ?? null,
    tip: normalizedPricing.tip ?? null,
  };
  const hasPricingSnapshot = Object.values(pricingSnapshotData).some(
    (value) => value != null,
  );

  const deliveryDetailsData = {
    placeType: normalizedDelivery.placeType ?? null,
    locationName: normalizedDelivery.locationName ?? null,
    addressLine: normalizedDelivery.addressLine ?? null,
    island: normalizedDelivery.island ?? null,
    arrivalFlight: normalizedDelivery.arrivalFlight ?? null,
    departureFlight: normalizedDelivery.departureFlight ?? null,
    arrivalHour: normalizedDelivery.arrivalHour ?? null,
    arrivalMinute: normalizedDelivery.arrivalMinute ?? null,
  };
  const hasDeliveryDetails = Object.values(deliveryDetailsData).some(
    (value) => value != null,
  );

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
            assignedFleetVehicleId: selectedFleet?.id ?? null,
            assignedFleetPlate: selectedFleet?.plate ?? null,
            quoteid: linkedQuoteId,
            contactname: effectiveContactName,
            contactemail: trimmedEmail ?? '',
            contactphone: trimmedPhone ?? null,
            rentalstart: parsedStart,
            rentalend: parsedEnd,
            rentaldays: effectiveRentalDays,
            status: effectiveStatus,
            updated: trimmedSelfServiceEventsJson ?? null,
            payload: payloadForStorage,
            humanId: nextHumanId ?? undefined,
            ...(hasPricingSnapshot
              ? {
                  bookingPricingSnapshot: {
                    create: pricingSnapshotData,
                  },
                }
              : {}),
            ...(hasDeliveryDetails
              ? {
                  bookingDeliveryDetails: {
                    create: deliveryDetailsData,
                  },
                }
              : {}),
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
