import { db } from '@/lib/db';
import type { ContactQuotes } from '@prisma/client';
import type { BookingRequestData } from '@/types/booking-request';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type QuoteLookup = { id: string } | { humanId: string };

const buildQuoteLookup = (identifier: string): QuoteLookup | null => {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  if (UUID_PATTERN.test(trimmed)) {
    return { id: trimmed };
  }
  return { humanId: trimmed };
};

export type ContactQuotePayload = {
  locale: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: 'email' | 'phone' | 'whatsapp' | 'viber';
  extras?: string[];
  rentalStart?: string;
  rentalEnd?: string;
  arrivalFlight: string;
  departureFlight: string;
  partySize?: string;
  children?: string;
  carId?: string;
  delivery?: {
    placeType?: string;
    locationName?: string;
    address?: {
      country?: string;
      postalCode?: string;
      city?: string;
      street?: string;
      streetType?: string;
      doorNumber?: string;
    };
  };
};

export type ContactQuote = ContactQuotePayload & {
  id: string;
  humanId?: string | null;
  createdAt: string | null;
  updatedAt?: string | null;
  status?: string;
  carName?: string | null;
  bookingRequestData?: BookingRequestData;
};

const toDateString = (value?: Date | null) =>
  value ? value.toISOString().slice(0, 10) : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toNullableString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeBookingRequestData = (
  raw: unknown
): BookingRequestData | undefined => {
  if (!isRecord(raw)) return undefined;
  const normalized: BookingRequestData = {
    adminName: toNullableString(raw.adminName),
    carId: toNullableString(raw.carId),
    carName: toNullableString(raw.carName),
    rentalStart: toNullableString(raw.rentalStart),
    rentalEnd: toNullableString(raw.rentalEnd),
    rentalFee: toNullableString(raw.rentalFee),
    deposit: toNullableString(raw.deposit),
    insurance: toNullableString(raw.insurance),
    deliveryFee: toNullableString(raw.deliveryFee),
    extrasFee: toNullableString(raw.extrasFee),
    locale: toNullableString(raw.locale),
    contactName: toNullableString(raw.contactName),
    contactEmail: toNullableString(raw.contactEmail),
    bookingLink: toNullableString(raw.bookingLink),
  };

  return Object.values(normalized).some((value) => value != null)
    ? normalized
    : undefined;
};

const normalizeQuote = (quote: ContactQuotes): ContactQuote => {
  const delivery = (quote.delivery as ContactQuote['delivery'] | undefined) ?? {};
  const address = delivery.address ?? {};
  return {
    id: quote.id,
    humanId: quote.humanId ?? null,
    createdAt: quote.createdAt?.toISOString() ?? null,
    updatedAt: quote.updatedAt?.toISOString() ?? null,
    locale: quote.locale ?? '',
    name: quote.name ?? '',
    email: quote.email ?? '',
    phone: quote.phone ?? '',
    preferredChannel:
      (quote.preferredchannel as ContactQuote['preferredChannel']) ?? 'email',
    extras: quote.extras ?? [],
    rentalStart: toDateString(quote.rentalstart),
    rentalEnd: toDateString(quote.rentalend),
    arrivalFlight: quote.arrivalflight ?? '',
    departureFlight: quote.departureflight ?? '',
    partySize: quote.partysize ?? undefined,
    children: quote.children ?? undefined,
    carId: quote.carid ?? undefined,
    carName: quote.carname ?? undefined,
    delivery: {
      placeType: delivery.placeType ?? undefined,
      locationName: delivery.locationName ?? undefined,
      address: {
        country: address.country ?? undefined,
        postalCode: address.postalCode ?? undefined,
        city: address.city ?? undefined,
        street: address.street ?? undefined,
        streetType: address.streetType ?? undefined,
        doorNumber: address.doorNumber ?? undefined,
      },
    },
    status: quote.status ?? undefined,
    bookingRequestData: normalizeBookingRequestData(quote.bookingRequestData),
  };
};

export const getQuotes = async (): Promise<ContactQuote[]> => {
  const quotes = await db.contactQuotes.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return quotes.map(normalizeQuote);
};

export const getQuoteById = async (
  id: string
): Promise<ContactQuote | null> => {
  const where = buildQuoteLookup(id);
  if (!where) return null;
  const quote = await db.contactQuotes.findUnique({ where });
  return quote ? normalizeQuote(quote) : null;
};
