import { FleetStatus } from '@/components/car/types';
import type { FleetEditSection } from '@/components/car/types';

export const DEFAULT_LOGIN_REDIRECT = '/';

export const CONTACT_STATUS_NEW = 'new' as const;
export const CONTACT_STATUS_QUOTE_SENT = 'quote_sent' as const;
export const CONTACT_STATUS_QUOTE_ACCEPTED = 'quote_accepted' as const;

export type ContactStatus =
  | typeof CONTACT_STATUS_NEW
  | typeof CONTACT_STATUS_QUOTE_SENT
  | typeof CONTACT_STATUS_QUOTE_ACCEPTED;

export const RENT_STATUS_NEW = 'new' as const;
export const RENT_STATUS_FORM_SUBMITTED = 'form_submitted' as const;
export const RENT_STATUS_ACCEPTED = 'accepted' as const;
export const RENT_STATUS_REGISTERED = 'registered' as const;
export const RENT_STATUS_CANCELLED = 'cancelled' as const;

export type RentRequestStatus =
  | typeof RENT_STATUS_NEW
  | typeof RENT_STATUS_FORM_SUBMITTED
  | typeof RENT_STATUS_ACCEPTED
  | typeof RENT_STATUS_REGISTERED
  | typeof RENT_STATUS_CANCELLED;

export const MAIL_HOST = process.env.MAIL_HOST;
export const MAIL_PORT = Number(process.env.MAIL_PORT ?? 0);
export const MAIL_USER = process.env.MAIL_USER;
export const MAIL_PASS = process.env.MAIL_PASS;
export const BOOKING_EMAIL_FROM =
  process.env.BOOKING_EMAIL_FROM ??
  process.env.EMAIL_FROM ??
  process.env.MAIL_USER;
export const QUOTE_PROCESSED_STATUS = CONTACT_STATUS_QUOTE_SENT;
export const QUOTE_DONE_STATUS = CONTACT_STATUS_QUOTE_ACCEPTED;
export const LOGO_URL =
  process.env.BOOKING_EMAIL_LOGO_URL ||
  process.env.LOGO_URL ||
  'https://zodiacsrentacar.com/logo_white.png';

export const PUBLIC_SITE_BASE_URL =
  process.env.PUBLIC_SITE_BASE_URL || 'https://zodiacsrentacar.com';
export const PUBLIC_CONTRACT_BASE_URL =
  process.env.PUBLIC_CONTRACT_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  PUBLIC_SITE_BASE_URL;
export const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
export const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
export const WHATSAPP_GRAPH_API_VERSION =
  process.env.WHATSAPP_GRAPH_API_VERSION;
export const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
export const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

export const ADMIN_SIGNATURE = {
  company: 'ZODIACS Rent a Car',
  phone: '+34 683 192 422',
  email: 'info@zodiacsrentacar.com',
  website: 'https://zodiacsrentacar.com',
  locations: 'Fuerteventura & Lanzarote',
};

export const BRAND = {
  sky: '#8ecae6',
  blue: '#219ebc',
  navy: '#023047',
  navyLight: '#234f63',
  amber: '#ffb703',
  orange: '#fb8500',
  background: '#f7f9fb',
};

export const LOCALE_LABELS: Record<string, string> = {
  hu: 'Magyar',
  en: 'Angol',
  de: 'Német',
  ro: 'Román',
  fr: 'Francia',
  es: 'Spanyol',
  it: 'Olasz',
  sk: 'Szlovák',
  cz: 'Cseh',
  se: 'Svéd',
  no: 'Norvég',
  dk: 'Dán',
  pl: 'Lengyel',
};

export const PALETTE = ['#2563eb', '#0ea5e9', '#14b8a6', '#f97316', '#ef4444'];

export const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const MONTHS = [
  'Január',
  'Február',
  'Március',
  'Április',
  'Május',
  'Június',
  'Július',
  'Augusztus',
  'Szeptember',
  'Október',
  'November',
  'December',
] as const;

export const FLEET_EDIT_SECTIONS: { id: FleetEditSection; label: string }[] = [
  { id: 'base', label: 'Alapadatok' },
  { id: 'service', label: 'Szerviz adatok' },
  { id: 'costs', label: 'Költségek' },
];

export const SUPPORTED_LOCALE_CODES = Object.keys(LOCALE_LABELS);
export const SUPPORTED_LOCALE_SET = new Set(SUPPORTED_LOCALE_CODES);
export const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DAY_MS = 1000 * 60 * 60 * 24;

export const MAX_DAMAGE_UPLOADS_PER_REQUEST = 3;

export const STATUS_LABELS: Record<FleetStatus, string> = {
  available: 'Elérhető',
  rented: 'Kikölcsönözve',
  reserved: 'Foglalt',
  maintenance: 'Szerviz',
};
