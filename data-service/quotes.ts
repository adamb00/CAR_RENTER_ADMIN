import { db } from '@/lib/db';

export type ContactQuotePayload = {
  locale: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: 'email' | 'phone' | 'whatsapp' | 'viber';
  rentalStart?: string;
  rentalEnd?: string;
  arrivalFlight: string;
  departureFlight: string;
  partySize?: string;
  children?: string;
  carId?: string;
};

export type ContactQuote = ContactQuotePayload & {
  id: string;
  createdAt: string | null;
  updatedAt?: string | null;
  status?: string;
  carName?: string | null;
};

const toDateString = (value?: Date | null) =>
  value ? value.toISOString().slice(0, 10) : undefined;

const normalizeQuote = (quote: {
  id: string;
  locale: string;
  name: string;
  email: string;
  phone: string;
  preferredchannel: string;
  rentalstart: Date | null;
  rentalend: Date | null;
  arrivalflight: string | null;
  departureflight: string | null;
  partysize: string | null;
  children: string | null;
  carid: string | null;
  carname: string | null;
  status: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}): ContactQuote => {
  return {
    id: quote.id,
    createdAt: quote.createdAt?.toISOString() ?? null,
    updatedAt: quote.updatedAt?.toISOString() ?? null,
    locale: quote.locale ?? '',
    name: quote.name ?? '',
    email: quote.email ?? '',
    phone: quote.phone ?? '',
    preferredChannel: (quote.preferredchannel as ContactQuote['preferredChannel']) ?? 'email',
    rentalStart: toDateString(quote.rentalstart),
    rentalEnd: toDateString(quote.rentalend),
    arrivalFlight: quote.arrivalflight ?? '',
    departureFlight: quote.departureflight ?? '',
    partySize: quote.partysize ?? undefined,
    children: quote.children ?? undefined,
    carId: quote.carid ?? undefined,
    carName: quote.carname ?? undefined,
    status: quote.status ?? undefined,
  };
};

export const getQuotes = async (): Promise<ContactQuote[]> => {
  const quotes = await db.contactQuotes.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return quotes.map(normalizeQuote);
};

export const getQuoteById = async (id: string): Promise<ContactQuote | null> => {
  const quote = await db.contactQuotes.findUnique({ where: { id } });
  return quote ? normalizeQuote(quote) : null;
};
