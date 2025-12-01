import type { ContactQuotes, RentRequests } from '@prisma/client';

import { db } from '@/lib/db';

export type BookingAddress = {
  country?: string;
  postalCode?: string;
  city?: string;
  street?: string;
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

export type BookingPayload = {
  locale?: string;
  carId?: string;
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
    locationName?: string;
    arrivalFlight?: string;
    departureFlight?: string;
    address?: BookingAddress;
  };
  tax?: {
    id?: string;
    companyName?: string;
  };
  consents?: {
    privacy?: boolean;
    terms?: boolean;
  };
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
  rentalStart?: string;
  rentalEnd?: string;
  status?: string | null;
  updatedNote?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  payload: BookingPayload | null;
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

const normalizeAddress = (value: unknown): BookingAddress | undefined => {
  if (!isRecord(value)) return undefined;
  return {
    country: toOptionalString(value.country),
    postalCode: toOptionalString(value.postalCode),
    city: toOptionalString(value.city),
    street: toOptionalString(value.street),
    doorNumber: toOptionalString(value.doorNumber),
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
                    item.document.drivingLicenceNumber
                  ),
                  drivingLicenceValidFrom: toOptionalString(
                    item.document.drivingLicenceValidFrom
                  ),
                  drivingLicenceValidUntil: toOptionalString(
                    item.document.drivingLicenceValidUntil
                  ),
                  drivingLicenceIsOlderThan_3: toOptionalBoolean(
                    item.document.drivingLicenceIsOlderThan_3
                  ),
                  drivingLicenceCategory: toOptionalString(
                    item.document.drivingLicenceCategory
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
              : typeof item.height === 'string' && !Number.isNaN(Number(item.height))
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
        locationName: toOptionalString(payload.delivery.locationName),
        arrivalFlight: toOptionalString(payload.delivery.arrivalFlight),
        departureFlight: toOptionalString(payload.delivery.departureFlight),
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
      }
    : undefined;

  return {
    locale: toOptionalString(payload.locale),
    carId: toOptionalString(payload.carId),
    quoteId: toOptionalString(payload.quoteId),
    extras: Array.isArray(payload.extras)
      ? payload.extras
          .map((item) => toOptionalString(item))
          .filter((item): item is string => Boolean(item))
      : undefined,
    adults:
      typeof payload.adults === 'number'
        ? payload.adults
        : typeof payload.adults === 'string' && !Number.isNaN(Number(payload.adults))
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
  };
};

type BookingWithQuote = RentRequests & {
  ContactQuotes: ContactQuotes | null;
};

const normalizeBooking = (booking: BookingWithQuote): Booking => ({
  id: booking.id,
  humanId: booking.humanId ?? booking.ContactQuotes?.humanId ?? null,
  locale: booking.locale ?? '',
  carId: booking.carid ?? undefined,
  quoteId: booking.quoteid ?? undefined,
  contactName: booking.contactname ?? '',
  contactEmail: booking.contactemail ?? null,
  contactPhone: booking.contactphone ?? null,
  rentalStart: toDateString(booking.rentalstart),
  rentalEnd: toDateString(booking.rentalend),
  status: booking.status ?? undefined,
  updatedNote: booking.updated ?? undefined,
  createdAt: toDateTimeString(booking.createdAt),
  updatedAt: toDateTimeString(booking.updatedAt),
  payload: normalizeBookingPayload(booking.payload),
});

const QUOTE_COMPLETED_STATUS = 'answered';

const syncQuoteStatusesForBookings = async (bookings: RentRequests[]) => {
  const quoteIds = Array.from(
    new Set(
      bookings
        .map((booking) => booking.quoteid)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (quoteIds.length === 0) return;

  try {
    await db.contactQuotes.updateMany({
      where: { id: { in: quoteIds } },
      data: { status: QUOTE_COMPLETED_STATUS, updatedAt: new Date() },
    });
  } catch (error) {
    console.error('syncQuoteStatusesForBookings', error);
  }
};

export const getBookings = async (): Promise<Booking[]> => {
  const bookingsRaw = await db.rentRequests.findMany({
    orderBy: { createdAt: 'desc' },
    include: { ContactQuotes: true },
  });
  await syncQuoteStatusesForBookings(bookingsRaw);

  const normalized = bookingsRaw.map(normalizeBooking);
  const carIds = Array.from(
    new Set(
      normalized
        .map((booking) => booking.carId ?? booking.payload?.carId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const cars =
    carIds.length > 0
      ? await db.car.findMany({
          where: { id: { in: carIds } },
          select: { id: true, manufacturer: true, model: true },
        })
      : [];

  const carMap = new Map(
    cars.map((car) => [car.id, `${car.manufacturer} ${car.model}`.trim()])
  );

  return normalized.map((booking) => {
    const carId = booking.carId ?? booking.payload?.carId;
    return {
      ...booking,
      carLabel: carId ? carMap.get(carId) ?? carId : undefined,
    };
  });
};

export const getBookingById = async (id: string): Promise<Booking | null> => {
  const booking = await db.rentRequests.findUnique({
    where: { id },
    include: { ContactQuotes: true },
  });
  if (!booking) return null;

  await syncQuoteStatusesForBookings([booking]);

  const normalized = normalizeBooking(booking);
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
  quoteId: string
): Promise<Booking | null> => {
  const booking = await db.rentRequests.findFirst({
    where: { quoteid: quoteId },
    orderBy: { createdAt: 'desc' },
    include: { ContactQuotes: true },
  });

  if (!booking) return null;

  await syncQuoteStatusesForBookings([booking]);

  const normalized = normalizeBooking(booking);
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
