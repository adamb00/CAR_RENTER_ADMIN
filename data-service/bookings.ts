import { Prisma, type RentRequests } from '@prisma/client';

import { getArchivedBookingIdSet } from '@/lib/booking-archive';
import { db } from '@/lib/db';
import { QUOTE_DONE_STATUS } from '@/lib/constants';

export type BookingAddress = {
  country?: string;
  postalCode?: string;
  city?: string;
  street?: string;
  streetType?: string;
  doorNumber?: string;
};

export type BookingDriver = {
  firstName_1?: string;
  firstName_2?: string;
  lastName_1?: string;
  lastName_2?: string;
  phoneNumber?: string;
  email?: string;
  location?: BookingAddress;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nameOfMother?: string;
  document?: {
    type?: string;
    number?: string;
    validFrom?: string;
    validUntil?: string;
    drivingLicenceNumber?: string;
    drivingLicenceValidFrom?: string;
    drivingLicenceValidUntil?: string;
    drivingLicenceIsOlderThan_3?: boolean;
    drivingLicenceCategory?: string;
  };
};

export type BookingChild = {
  age?: number;
  height?: number;
};

export type BookingPricing = {
  rentalFee?: string;
  insurance?: string;
  deposit?: string;
  deliveryFee?: string;
  deliveryLocation?: string;
  extrasFee?: string;
  tip?: string;
};

export type BookingHandoverCosts = {
  fuelCost?: string;
  ferryCost?: string;
  cleaningCost?: string;
};

export const PAYMENT_METHOD_VALUES = [
  'advance_transfer',
  'cash_on_pickup',
  'card_on_pickup',
  'instant_transfer_on_pickup',
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHOD_VALUES)[number];

export type BookingPayload = {
  locale?: string;
  carId?: string;
  assignedFleetVehicleId?: string;
  assignedFleetPlate?: string;
  quoteId?: string;
  extras?: string[];
  adults?: number;
  children?: BookingChild[];
  rentalPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  driver?: BookingDriver[];
  contact?: {
    same?: boolean;
    name?: string;
    email?: string;
  };
  invoice?: {
    same?: boolean;
    name?: string;
    phoneNumber?: string;
    email?: string;
    location?: BookingAddress;
  };
  delivery?: {
    placeType?: string;
    island?: string;
    locationName?: string;
    arrivalFlight?: string;
    departureFlight?: string;
    arrivalHour?: string;
    arrivalMinute?: string;
    address?: BookingAddress;
  };
  tax?: {
    id?: string;
    companyName?: string;
  };
  consents?: {
    privacy?: boolean;
    terms?: boolean;
    insurance?: boolean;
    paymentMethod?: PaymentMethodValue;
  };
  pricing?: BookingPricing;
  handoverTip?: string;
  handoverCosts?: {
    out?: BookingHandoverCosts;
    in?: BookingHandoverCosts;
  };
};

export type BookingSelfServiceChange = {
  field: string;
  previous?: string;
  next?: string;
};

export type BookingSelfServiceEvent = {
  action?: string;
  timestamp?: string;
  changes: BookingSelfServiceChange[];
};

export type Booking = {
  id: string;
  humanId?: string | null;
  locale: string;
  carId?: string;
  carLabel?: string;
  quoteId?: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone?: string | null;
  assignedFleetVehicleId?: string;
  assignedFleetPlate?: string;
  deliveryIsland?: string | null;
  rentalStart?: string;
  rentalEnd?: string;
  rentalDays?: number;
  status?: string | null;
  updatedNote?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  payload: BookingPayload | null;
  selfServiceEvents?: BookingSelfServiceEvent[];
  pricing?: BookingPricing | null;
};

const toDateString = (value?: Date | null) =>
  value ? value.toISOString().slice(0, 10) : undefined;

const toDateTimeString = (value?: Date | null) =>
  value ? value.toISOString() : null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toOptionalString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const toOptionalBoolean = (value: unknown) =>
  typeof value === 'boolean' ? value : undefined;

const toOptionalPaymentMethod = (
  value: unknown,
): PaymentMethodValue | undefined =>
  typeof value === 'string' &&
  PAYMENT_METHOD_VALUES.includes(value as PaymentMethodValue)
    ? (value as PaymentMethodValue)
    : undefined;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type BookingLookup = { id: string } | { humanId: string };

const buildBookingLookup = (identifier: string): BookingLookup | null => {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  if (UUID_PATTERN.test(trimmed)) {
    return { id: trimmed };
  }
  return { humanId: trimmed };
};

const normalizeAddress = (value: unknown): BookingAddress | undefined => {
  if (!isRecord(value)) return undefined;
  const record = value;
  return {
    country: toOptionalString(record.country),
    postalCode: toOptionalString(record.postalCode),
    city: toOptionalString(record.city),
    street: toOptionalString(record.street),
    streetType: toOptionalString(record.streetType),
    doorNumber: toOptionalString(record.doorNumber),
  };
};

const normalizeBookingPayload = (payload: unknown): BookingPayload | null => {
  if (!isRecord(payload)) return null;

  const rentalPeriod = isRecord(payload.rentalPeriod)
    ? {
        startDate: toOptionalString(payload.rentalPeriod.startDate),
        endDate: toOptionalString(payload.rentalPeriod.endDate),
      }
    : undefined;

  const driver =
    Array.isArray(payload.driver) && payload.driver.length > 0
      ? payload.driver.reduce<BookingDriver[]>((acc, item) => {
          if (!isRecord(item)) return acc;
          acc.push({
            firstName_1: toOptionalString(item.firstName_1),
            firstName_2: toOptionalString(item.firstName_2),
            lastName_1: toOptionalString(item.lastName_1),
            lastName_2: toOptionalString(item.lastName_2),
            phoneNumber: toOptionalString(item.phoneNumber),
            email: toOptionalString(item.email),
            location: normalizeAddress(item.location),
            dateOfBirth: toOptionalString(item.dateOfBirth),
            placeOfBirth: toOptionalString(item.placeOfBirth),
            nameOfMother: toOptionalString(item.nameOfMother),
            document: isRecord(item.document)
              ? {
                  type: toOptionalString(item.document.type),
                  number: toOptionalString(item.document.number),
                  validFrom: toOptionalString(item.document.validFrom),
                  validUntil: toOptionalString(item.document.validUntil),
                  drivingLicenceNumber: toOptionalString(
                    item.document.drivingLicenceNumber,
                  ),
                  drivingLicenceValidFrom: toOptionalString(
                    item.document.drivingLicenceValidFrom,
                  ),
                  drivingLicenceValidUntil: toOptionalString(
                    item.document.drivingLicenceValidUntil,
                  ),
                  drivingLicenceIsOlderThan_3: toOptionalBoolean(
                    item.document.drivingLicenceIsOlderThan_3,
                  ),
                  drivingLicenceCategory: toOptionalString(
                    item.document.drivingLicenceCategory,
                  ),
                }
              : undefined,
          });
          return acc;
        }, [])
      : undefined;

  const children =
    Array.isArray(payload.children) && payload.children.length > 0
      ? payload.children.reduce<BookingChild[]>((acc, item) => {
          if (!isRecord(item)) return acc;
          const age =
            typeof item.age === 'number'
              ? item.age
              : typeof item.age === 'string' && !Number.isNaN(Number(item.age))
                ? Number(item.age)
                : undefined;
          const height =
            typeof item.height === 'number'
              ? item.height
              : typeof item.height === 'string' &&
                  !Number.isNaN(Number(item.height))
                ? Number(item.height)
                : undefined;
          acc.push({ age, height });
          return acc;
        }, [])
      : undefined;

  const contact = isRecord(payload.contact)
    ? {
        same: toOptionalBoolean(payload.contact.same),
        name: toOptionalString(payload.contact.name),
        email: toOptionalString(payload.contact.email),
      }
    : undefined;

  const invoice = isRecord(payload.invoice)
    ? {
        same: toOptionalBoolean(payload.invoice.same),
        name: toOptionalString(payload.invoice.name),
        phoneNumber: toOptionalString(payload.invoice.phoneNumber),
        email: toOptionalString(payload.invoice.email),
        location: normalizeAddress(payload.invoice.location),
      }
    : undefined;

  const delivery = isRecord(payload.delivery)
    ? {
        placeType: toOptionalString(payload.delivery.placeType),
        island: toOptionalString(payload.delivery.island),
        locationName: toOptionalString(payload.delivery.locationName),
        arrivalFlight: toOptionalString(payload.delivery.arrivalFlight),
        departureFlight: toOptionalString(payload.delivery.departureFlight),
        arrivalHour: toOptionalString(payload.delivery.arrivalHour),
        arrivalMinute: toOptionalString(payload.delivery.arrivalMinute),
        address: normalizeAddress(payload.delivery.address),
      }
    : undefined;

  const tax = isRecord(payload.tax)
    ? {
        id: toOptionalString(payload.tax.id),
        companyName: toOptionalString(payload.tax.companyName),
      }
    : undefined;

  const consents = isRecord(payload.consents)
    ? {
        privacy: toOptionalBoolean(payload.consents.privacy),
        terms: toOptionalBoolean(payload.consents.terms),
        insurance: toOptionalBoolean(payload.consents.insurance),
        paymentMethod: toOptionalPaymentMethod(payload.consents?.paymentMethod),
      }
    : undefined;

  const pricing = isRecord(payload.pricing)
    ? {
        rentalFee: toOptionalString(payload.pricing.rentalFee),
        insurance: toOptionalString(payload.pricing.insurance),
        deposit: toOptionalString(payload.pricing.deposit),
        deliveryFee: toOptionalString(payload.pricing.deliveryFee),
        deliveryLocation: toOptionalString(payload.pricing.deliveryLocation),
        extrasFee: toOptionalString(payload.pricing.extrasFee),
        tip: toOptionalString(payload.pricing.tip),
      }
    : undefined;

  const normalizeHandoverCosts = (
    value: unknown,
  ): BookingHandoverCosts | undefined => {
    if (!isRecord(value)) return undefined;
    return {
      fuelCost: toOptionalString(value.fuelCost),
      ferryCost: toOptionalString(value.ferryCost),
      cleaningCost: toOptionalString(value.cleaningCost),
    };
  };

  const handoverCosts = isRecord(payload.handoverCosts)
    ? {
        out: normalizeHandoverCosts(payload.handoverCosts.out),
        in: normalizeHandoverCosts(payload.handoverCosts.in),
      }
    : undefined;

  return {
    locale: toOptionalString(payload.locale),
    carId: toOptionalString(payload.carId),
    assignedFleetVehicleId: toOptionalString(payload.assignedFleetVehicleId),
    assignedFleetPlate: toOptionalString(payload.assignedFleetPlate),
    quoteId: toOptionalString(payload.quoteId),
    extras: Array.isArray(payload.extras)
      ? payload.extras
          .map((item) => toOptionalString(item))
          .filter((item): item is string => Boolean(item))
      : undefined,
    adults:
      typeof payload.adults === 'number'
        ? payload.adults
        : typeof payload.adults === 'string' &&
            !Number.isNaN(Number(payload.adults))
          ? Number(payload.adults)
          : undefined,
    children,
    rentalPeriod,
    driver,
    contact,
    invoice,
    delivery,
    tax,
    consents,
    pricing,
    handoverTip: toOptionalString(payload.handoverTip),
    handoverCosts,
  };
};

const toJSONValue = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
};

const normalizeSelfServiceChanges = (
  value: unknown,
): BookingSelfServiceChange[] => {
  if (!value) return [];

  const normalizeEntry = (entry: unknown): BookingSelfServiceChange | null => {
    if (!isRecord(entry)) return null;
    const fieldCandidate =
      (typeof entry.field === 'string' && entry.field) ||
      (typeof entry.key === 'string' && entry.key) ||
      (typeof entry.path === 'string' && entry.path) ||
      '';
    const previous =
      toJSONValue(
        entry.previous ??
          entry.from ??
          entry.old ??
          entry.before ??
          entry.previousValue,
      ) ?? undefined;
    const next =
      toJSONValue(
        entry.next ??
          entry.to ??
          entry.new ??
          entry.after ??
          entry.value ??
          entry.current,
      ) ?? undefined;

    if (!fieldCandidate && !previous && !next) return null;
    return {
      field: fieldCandidate || 'ismeretlen',
      previous,
      next,
    };
  };

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeEntry(item))
      .filter((item): item is BookingSelfServiceChange => Boolean(item));
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .map(([field, raw]) => {
        if (isRecord(raw)) {
          return {
            field,
            previous:
              toJSONValue(
                raw.previous ??
                  raw.from ??
                  raw.old ??
                  raw.before ??
                  raw.previousValue,
              ) ?? undefined,
            next:
              toJSONValue(
                raw.next ??
                  raw.to ??
                  raw.new ??
                  raw.after ??
                  raw.value ??
                  raw.current,
              ) ?? undefined,
          };
        }

        return {
          field,
          next: toJSONValue(raw) ?? undefined,
        };
      })
      .filter((item) => item.field || item.previous || item.next);
  }

  return [];
};

const parseSelfServiceEvents = (
  updated?: string | null,
): BookingSelfServiceEvent[] => {
  if (!updated) return [];
  const trimmed = updated.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    const entries = Array.isArray(parsed) ? parsed : [parsed];

    return entries
      .filter(
        (entry): entry is Record<string, unknown> =>
          isRecord(entry) && entry.action === 'self-service:modify',
      )
      .map((entry) => {
        const timestamp =
          typeof entry.timestamp === 'string' ? entry.timestamp : undefined;
        const changes = normalizeSelfServiceChanges(entry.changes);
        return {
          action: entry.action as string,
          timestamp,
          changes,
        };
      })
      .filter((event) => event.changes.length > 0);
  } catch {
    return [];
  }
};

type MinimalContactQuote = {
  humanId: string | null;
};

type BookingWithQuote = RentRequests & {
  ContactQuotes: MinimalContactQuote | null;
};

type BookingPricingSnapshotRow = {
  bookingId: string;
  rentalFee: string | null;
  insurance: string | null;
  deposit: string | null;
  deliveryFee: string | null;
  extrasFee: string | null;
  tip: string | null;
};

type BookingDeliveryDetailsRow = {
  bookingId: string;
  placeType: string | null;
  locationName: string | null;
  addressLine: string | null;
  island: string | null;
  arrivalFlight: string | null;
  departureFlight: string | null;
  arrivalHour: string | null;
  arrivalMinute: string | null;
};

type BookingHandoverCostRow = {
  bookingId: string;
  direction: 'out' | 'in';
  costType: 'tip' | 'fuel' | 'ferry' | 'cleaning';
  amount: unknown;
};

type BookingHandoverMarkerRow = {
  bookingId: string;
};

const toAmountString = (value: unknown): string | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : undefined;
  }
  const direct = toOptionalString(value)?.trim();
  if (direct) return direct;

  if (
    typeof value === 'object' &&
    value !== null &&
    'toString' in value &&
    typeof (value as { toString: () => string }).toString === 'function'
  ) {
    const serialized = (value as { toString: () => string }).toString().trim();
    return serialized.length > 0 ? serialized : undefined;
  }

  return undefined;
};

const hasAnyObjectValue = (value: Record<string, unknown>) =>
  Object.values(value).some((item) => item !== undefined);

const getNormalizedPayloadPartsByBookingId = async (bookingIds: string[]) => {
  const pricingByBookingId = new Map<string, BookingPayload['pricing']>();
  const deliveryByBookingId = new Map<string, BookingPayload['delivery']>();
  const islandByBookingId = new Map<string, string>();
  const handoverByBookingId = new Map<
    string,
    Pick<BookingPayload, 'handoverTip' | 'handoverCosts'>
  >();

  if (bookingIds.length === 0) {
    return {
      pricingByBookingId,
      deliveryByBookingId,
      islandByBookingId,
      handoverByBookingId,
    };
  }

  const bookingIdsSql = Prisma.join(
    bookingIds.map((id) => Prisma.sql`${id}::uuid`),
  );

  const [pricingRows, deliveryRows, handoverCostRows, handoverMarkerRows] =
    await Promise.all([
      db
        .$queryRaw<BookingPricingSnapshotRow[]>(
          Prisma.sql`
          SELECT
            "bookingId",
            "rentalFee",
            "insurance",
            "deposit",
            "deliveryFee",
            "extrasFee",
            "tip"
          FROM "BookingPricingSnapshots"
          WHERE "bookingId" IN (${bookingIdsSql})
        `,
        )
        .catch(() => []),
      db
        .$queryRaw<BookingDeliveryDetailsRow[]>(
          Prisma.sql`
          SELECT
            "bookingId",
            "placeType",
            "locationName",
            "addressLine",
            "island",
            "arrivalFlight",
            "departureFlight",
            "arrivalHour",
            "arrivalMinute"
          FROM "BookingDeliveryDetails"
          WHERE "bookingId" IN (${bookingIdsSql})
        `,
        )
        .catch(() => []),
      db
        .$queryRaw<BookingHandoverCostRow[]>(
          Prisma.sql`
          SELECT
            "bookingId",
            "direction",
            "costType",
            "amount"
          FROM "BookingHandoverCosts"
          WHERE "bookingId" IN (${bookingIdsSql})
        `,
        )
        .catch(() => []),
      db
        .$queryRaw<BookingHandoverMarkerRow[]>(
          Prisma.sql`
          SELECT DISTINCT
            "bookingId"
          FROM "VehicleHandovers"
          WHERE "bookingId" IN (${bookingIdsSql})
        `,
        )
        .catch(() => []),
    ]);

  for (const row of pricingRows) {
    const pricing = {
      rentalFee: row.rentalFee ?? undefined,
      insurance: row.insurance ?? undefined,
      deposit: row.deposit ?? undefined,
      deliveryFee: row.deliveryFee ?? undefined,
      extrasFee: row.extrasFee ?? undefined,
      tip: row.tip ?? undefined,
    };
    pricingByBookingId.set(
      row.bookingId,
      hasAnyObjectValue(pricing) ? pricing : {},
    );
  }

  for (const row of deliveryRows) {
    const delivery = {
      placeType: row.placeType ?? undefined,
      island: row.island ?? undefined,
      locationName: row.locationName ?? undefined,
      arrivalFlight: row.arrivalFlight ?? undefined,
      departureFlight: row.departureFlight ?? undefined,
      arrivalHour: row.arrivalHour ?? undefined,
      arrivalMinute: row.arrivalMinute ?? undefined,
      address: row.addressLine
        ? ({ street: row.addressLine } as BookingAddress)
        : undefined,
    };
    deliveryByBookingId.set(
      row.bookingId,
      hasAnyObjectValue(delivery) ? delivery : {},
    );
    if (row.island && row.island.trim().length > 0) {
      islandByBookingId.set(row.bookingId, row.island.trim());
    }
  }

  for (const marker of handoverMarkerRows) {
    handoverByBookingId.set(marker.bookingId, {});
  }

  for (const row of handoverCostRows) {
    const previous = handoverByBookingId.get(row.bookingId) ?? {};

    if (row.costType === 'tip' && row.direction === 'out') {
      handoverByBookingId.set(row.bookingId, {
        ...previous,
        handoverTip: toAmountString(row.amount),
      });
      continue;
    }

    const amount = toAmountString(row.amount);
    if (!amount) {
      handoverByBookingId.set(row.bookingId, previous);
      continue;
    }

    const costField =
      row.costType === 'fuel'
        ? 'fuelCost'
        : row.costType === 'ferry'
          ? 'ferryCost'
          : 'cleaningCost';

    const existingCosts = previous.handoverCosts ?? {};
    const directionCosts = existingCosts[row.direction] ?? {};

    handoverByBookingId.set(row.bookingId, {
      ...previous,
      handoverCosts: {
        ...existingCosts,
        [row.direction]: {
          ...directionCosts,
          [costField]: amount,
        },
      },
    });
  }

  return {
    pricingByBookingId,
    deliveryByBookingId,
    islandByBookingId,
    handoverByBookingId,
  };
};

const applyNormalizedPayloadByBookingId = ({
  bookingId,
  payload,
  pricingByBookingId,
  deliveryByBookingId,
  handoverByBookingId,
}: {
  bookingId: string;
  payload: BookingPayload | null;
  pricingByBookingId: Map<string, BookingPayload['pricing']>;
  deliveryByBookingId: Map<string, BookingPayload['delivery']>;
  handoverByBookingId: Map<
    string,
    Pick<BookingPayload, 'handoverTip' | 'handoverCosts'>
  >;
}): BookingPayload | null => {
  const nextPayload = payload ? { ...payload } : {};

  if (pricingByBookingId.has(bookingId)) {
    nextPayload.pricing = pricingByBookingId.get(bookingId);
  }

  if (deliveryByBookingId.has(bookingId)) {
    nextPayload.delivery = deliveryByBookingId.get(bookingId);
  }

  if (handoverByBookingId.has(bookingId)) {
    const handover = handoverByBookingId.get(bookingId) ?? {};
    if (handover.handoverTip) {
      nextPayload.handoverTip = handover.handoverTip;
    } else {
      delete nextPayload.handoverTip;
    }

    if (handover.handoverCosts && hasAnyObjectValue(handover.handoverCosts)) {
      nextPayload.handoverCosts = handover.handoverCosts;
    } else {
      delete nextPayload.handoverCosts;
    }
  }

  return Object.keys(nextPayload).length > 0 ? nextPayload : null;
};

const normalizeBooking = (booking: BookingWithQuote): Booking => ({
  id: booking.id,
  humanId: booking.humanId ?? booking.ContactQuotes?.humanId ?? null,
  locale: booking.locale ?? '',
  carId: booking.carid ?? undefined,
  assignedFleetVehicleId:
    booking.assignedFleetVehicleId ??
    (isRecord(booking.payload)
      ? toOptionalString(
          (booking.payload as Record<string, unknown>).assignedFleetVehicleId,
        )
      : undefined),
  assignedFleetPlate:
    booking.assignedFleetPlate ??
    (isRecord(booking.payload)
      ? toOptionalString(
          (booking.payload as Record<string, unknown>).assignedFleetPlate,
        )
      : undefined),
  quoteId: booking.quoteid ?? undefined,
  contactName: booking.contactname ?? '',
  contactEmail: booking.contactemail ?? null,
  contactPhone: booking.contactphone ?? null,
  rentalStart: toDateString(booking.rentalstart),
  rentalEnd: toDateString(booking.rentalend),
  rentalDays: booking.rentaldays ?? undefined,
  status: booking.status ?? undefined,
  updatedNote: booking.updated ?? undefined,
  deliveryIsland: null,
  createdAt: toDateTimeString(booking.createdAt),
  updatedAt: toDateTimeString(booking.updatedAt),
  payload: normalizeBookingPayload(booking.payload),
  selfServiceEvents: parseSelfServiceEvents(booking.updated),
});

const CONTACT_QUOTE_INCLUDE = {
  ContactQuotes: {
    select: {
      humanId: true,
    },
  },
} as const;

const syncQuoteStatusesForBookings = async (bookings: RentRequests[]) => {
  const quoteIds = Array.from(
    new Set(
      bookings
        .map((booking) => booking.quoteid)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (quoteIds.length === 0) return;

  try {
    await db.contactQuotes.updateMany({
      where: { id: { in: quoteIds } },
      data: { status: QUOTE_DONE_STATUS, updatedAt: new Date() },
    });
  } catch (error) {
    console.error('syncQuoteStatusesForBookings', error);
  }
};

export const getBookings = async (): Promise<Booking[]> => {
  const bookingsRaw = await db.rentRequests.findMany({
    orderBy: { createdAt: 'desc' },
    include: CONTACT_QUOTE_INCLUDE,
  });
  const archivedIdSet = await getArchivedBookingIdSet(
    bookingsRaw.map((booking) => booking.id),
  );
  const activeBookingsRaw = bookingsRaw.filter(
    (booking) => !archivedIdSet.has(booking.id),
  );
  await syncQuoteStatusesForBookings(activeBookingsRaw);

  const normalizedBase = activeBookingsRaw.map(normalizeBooking);
  const normalizedPayloadParts = await getNormalizedPayloadPartsByBookingId(
    normalizedBase.map((booking) => booking.id),
  );
  const normalized = normalizedBase.map((booking) => ({
    ...booking,
    deliveryIsland:
      normalizedPayloadParts.islandByBookingId.get(booking.id) ?? null,
    payload: applyNormalizedPayloadByBookingId({
      bookingId: booking.id,
      payload: booking.payload,
      ...normalizedPayloadParts,
    }),
  }));

  const carIds = Array.from(
    new Set(
      normalized
        .map((booking) => booking.carId ?? booking.payload?.carId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const cars =
    carIds.length > 0
      ? await db.car.findMany({
          where: { id: { in: carIds } },
          select: { id: true, manufacturer: true, model: true },
        })
      : [];

  const carMap = new Map(
    cars.map((car) => [car.id, `${car.manufacturer} ${car.model}`.trim()]),
  );

  return normalized.map((booking) => {
    const carId = booking.carId ?? booking.payload?.carId;
    return {
      ...booking,
      carLabel: carId ? (carMap.get(carId) ?? carId) : undefined,
    };
  });
};

export const getBookingById = async (id: string): Promise<Booking | null> => {
  const where = buildBookingLookup(id);
  if (!where) return null;

  const booking = await db.rentRequests.findUnique({
    where,
    include: CONTACT_QUOTE_INCLUDE,
  });
  if (!booking) return null;

  await syncQuoteStatusesForBookings([booking]);

  const normalizedBase = normalizeBooking(booking);
  const normalizedPayloadParts = await getNormalizedPayloadPartsByBookingId([
    normalizedBase.id,
  ]);
  const normalized = {
    ...normalizedBase,
    deliveryIsland:
      normalizedPayloadParts.islandByBookingId.get(normalizedBase.id) ?? null,
    payload: applyNormalizedPayloadByBookingId({
      bookingId: normalizedBase.id,
      payload: normalizedBase.payload,
      ...normalizedPayloadParts,
    }),
  };
  const carId = normalized.carId ?? normalized.payload?.carId;
  if (!carId) return normalized;

  const car = await db.car.findUnique({
    where: { id: carId },
    select: { manufacturer: true, model: true },
  });

  return {
    ...normalized,
    carLabel: car ? `${car.manufacturer} ${car.model}`.trim() : carId,
  };
};

export const getBookingByQuoteId = async (
  quoteId: string,
): Promise<Booking | null> => {
  const trimmedQuoteId = quoteId.trim();
  if (!trimmedQuoteId) return null;
  const bookings = await db.rentRequests.findMany({
    where: { quoteid: trimmedQuoteId },
    orderBy: { createdAt: 'desc' },
    include: CONTACT_QUOTE_INCLUDE,
  });
  const archivedIdSet = await getArchivedBookingIdSet(
    bookings.map((booking) => booking.id),
  );
  const booking = bookings.find(
    (candidate) => !archivedIdSet.has(candidate.id),
  );

  if (!booking) return null;

  await syncQuoteStatusesForBookings([booking]);

  const normalizedBase = normalizeBooking(booking);
  const normalizedPayloadParts = await getNormalizedPayloadPartsByBookingId([
    normalizedBase.id,
  ]);
  const normalized = {
    ...normalizedBase,
    deliveryIsland:
      normalizedPayloadParts.islandByBookingId.get(normalizedBase.id) ?? null,
    payload: applyNormalizedPayloadByBookingId({
      bookingId: normalizedBase.id,
      payload: normalizedBase.payload,
      ...normalizedPayloadParts,
    }),
  };
  const carId = normalized.carId ?? normalized.payload?.carId;

  if (!carId) return normalized;

  const car = await db.car.findUnique({
    where: { id: carId },
    select: { manufacturer: true, model: true },
  });

  return {
    ...normalized,
    carLabel: car ? `${car.manufacturer} ${car.model}`.trim() : carId,
  };
};

export const getDeliveryAddressByBookingId = async (
  bookingId: string,
): Promise<BookingDeliveryDetailsRow | null> => {
  const rows = await db
    .$queryRaw<BookingDeliveryDetailsRow[]>(
      Prisma.sql`
        SELECT
          "bookingId",
          "placeType",
          "locationName",
          "addressLine",
          "island",
          "arrivalFlight",
          "departureFlight",
          "arrivalHour",
          "arrivalMinute"
        FROM "BookingDeliveryDetails"
        WHERE "bookingId" = ${bookingId}::uuid
        LIMIT 1
      `,
    )
    .catch(() => []);

  const [deliveryDetails] = rows;
  return deliveryDetails ?? null;
};

export const getIsCarOut = async (id: string) => {
  const isCarOut = await db.bookingHandoverCost.findFirst({
    where: { bookingId: id, direction: 'out' },
  });

  if (isCarOut) return true;

  return false;
};
