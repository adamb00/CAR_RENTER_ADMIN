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
