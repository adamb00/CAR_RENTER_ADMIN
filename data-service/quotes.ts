import { db } from '@/lib/db';
import type { ContactQuotes } from '@prisma/client';
import type {
  BookingRequestData,
  BookingRequestDataPayload,
} from '@/types/booking-request';
import { resolveOfferCarsCount } from '@/lib/offer-car-count';
import { resolveOfferRentalPricing } from '@/lib/quote-offer-pricing';

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
  rentalDays?: number;
  carId?: string;
  cars?: string;
  residenceCard?: string[];
  offerAccepted?: number;
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
  signerName?: string | null;
  carName?: string | null;
  bookingRequestData?: BookingRequestDataPayload;
  rentalDays?: number;
  offerAccepted?: number;
  offerSent?: Date | null;
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

const normalizeResidenceCardEntry = (value: unknown): string | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed;
    }

    try {
      return normalizeResidenceCardEntry(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (!isRecord(value)) return null;

  const type = toNullableString(value.type);
  const content = toNullableString(value.content);
  const url = toNullableString(value.url);

  if (url) return url;
  if (!content) return null;
  if (content.startsWith('data:')) return content;

  return `data:${type ?? 'image/png'};base64,${content}`;
};

const normalizeResidenceCard = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => normalizeResidenceCardEntry(entry))
    .filter((entry): entry is string => Boolean(entry));
};

const normalizeBookingRequestEntry = (
  raw: unknown,
): BookingRequestData | undefined => {
  if (!isRecord(raw)) return undefined;
  const pricing = resolveOfferRentalPricing({
    rentalFee: toNullableString(raw.rentalFee),
    originalRentalFee: toNullableString(raw.originalRentalFee),
    discountedRentalFee: toNullableString(raw.discountedRentalFee),
  });
  const normalized: BookingRequestData = {
    adminName: toNullableString(raw.adminName),
    carId: toNullableString(raw.carId),
    carName: toNullableString(raw.carName),
    appliesToCars: resolveOfferCarsCount(raw.appliesToCars),
    rentalStart: toNullableString(raw.rentalStart),
    rentalEnd: toNullableString(raw.rentalEnd),
    rentalFee: pricing.effectiveRentalFee,
    originalRentalFee: pricing.originalRentalFee,
    discountedRentalFee: pricing.discountedRentalFee,
    deposit: toNullableString(raw.deposit),
    insurance: toNullableString(raw.insurance),
    deliveryFee: toNullableString(raw.deliveryFee),
    deliveryLocation: toNullableString(raw.deliveryLocation),
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

const normalizeBookingRequestData = (
  raw: unknown,
): BookingRequestDataPayload | undefined => {
  if (Array.isArray(raw)) {
    const entries = raw
      .map((entry) => normalizeBookingRequestEntry(entry))
      .filter((entry): entry is BookingRequestData => Boolean(entry));
    return entries.length > 0 ? entries : undefined;
  }
  return normalizeBookingRequestEntry(raw);
};

const normalizeQuote = (quote: ContactQuotes): ContactQuote => {
  const extendedQuote = quote as ContactQuotes & {
    signerName?: string | null;
    rentaldays?: number | null;
    cars?: string | null;
    residenceCard?: string[] | null;
  };
  const signerName = extendedQuote.signerName ?? null;
  const delivery =
    (quote.delivery as ContactQuote['delivery'] | undefined) ?? {};
  const address = delivery.address ?? {};
  const rentalDays = extendedQuote.rentaldays ?? undefined;
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
    cars: extendedQuote.cars ?? undefined,
    children: quote.children ?? undefined,
    carId: quote.carid ?? undefined,
    carName: quote.carname ?? undefined,
    residenceCard: normalizeResidenceCard(extendedQuote.residenceCard),
    rentalDays,
    offerAccepted: quote.offerAccepted ?? undefined,
    offerSent: quote.offerSent ?? null,
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
    signerName,
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
  id: string,
): Promise<ContactQuote | null> => {
  const where = buildQuoteLookup(id);
  if (!where) return null;
  const quote = await db.contactQuotes.findUnique({ where });

  return quote ? normalizeQuote(quote) : null;
};
