import { Booking } from '@/data-service/bookings';

export const formatDate = (
  value: string | null | undefined,
  month: 'short' | 'long',
  locale: string = 'hu-HU',
) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(locale, {
        year: 'numeric',
        month: month,
        day: 'numeric',
      });
};

export const formatDateTimeDetail = (value?: string | null) => {
  if (!value) return 'Ismeretlen időpont';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateForInput = (value?: Date | string | null) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export const formatArrivalTime = (
  hour?: string | null,
  minute?: string | null,
) => {
  const hourText = hour?.trim() ?? '';
  const minuteText = minute?.trim() ?? '';
  if (!hourText && !minuteText) return '—';

  const normalizedHour =
    hourText.length > 0 && /^\d+$/.test(hourText)
      ? hourText.padStart(2, '0')
      : hourText || '--';
  const normalizedMinute =
    minuteText.length > 0 && /^\d+$/.test(minuteText)
      ? minuteText.padStart(2, '0')
      : minuteText || '--';

  return `${normalizedHour}:${normalizedMinute}`;
};

export const formatDatePeriod = (booking: Booking) => {
  const start = booking.rentalStart ?? booking.payload?.rentalPeriod?.startDate;
  const end = booking.rentalEnd ?? booking.payload?.rentalPeriod?.endDate;
  return start || end ? `${start ?? '—'} → ${end ?? '—'}` : '—';
};
