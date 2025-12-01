import { db } from '@/lib/db';
import type { ContactQuotes } from '@prisma/client';

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
};

const toDateString = (value?: Date | null) =>
  value ? value.toISOString().slice(0, 10) : undefined;

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
        doorNumber: address.doorNumber ?? undefined,
      },
    },
    status: quote.status ?? undefined,
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
  const quote = await db.contactQuotes.findUnique({ where: { id } });
  return quote ? normalizeQuote(quote) : null;
};
