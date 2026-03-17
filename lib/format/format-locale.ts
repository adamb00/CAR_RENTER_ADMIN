import { BOOKING_CONFIRMATION_COPY } from '@/components/emails/booking-confirmation-email';
import { LOCALE_LABELS } from '../constants';

export const formatLocale = (locale: string | null | undefined) =>
  locale ? (LOCALE_LABELS[locale] ?? locale) : '—';

export const normalizeConfirmationLocale = (locale?: string | null) => {
  if (!locale) return 'en';
  const normalized = locale.toLowerCase();
  return BOOKING_CONFIRMATION_COPY[normalized] ? normalized : 'en';
};
