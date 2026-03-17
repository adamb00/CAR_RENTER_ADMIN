import { BookingInterval, buildBookingInterval } from '@/lib/booking-interval';
import { BookingCalendarBooking, BookingCalendarVehicle } from './types';

export const toIsoDate = (value: Date) => {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toDate = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (match) {
    const [, yearText, monthText, dayText] = match;
    const year = Number.parseInt(yearText, 10);
    const month = Number.parseInt(monthText, 10);
    const day = Number.parseInt(dayText, 10);
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    ) {
      return null;
    }
    return new Date(Date.UTC(year, month - 1, day));
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    ),
  );
};

export const startOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

export const getBookingInterval = (
  booking: BookingCalendarBooking,
): BookingInterval | null => {
  return buildBookingInterval({
    rentalStart: booking.rentalStart,
    rentalEnd: booking.rentalEnd,
    arrivalHour: booking.arrivalHour,
    arrivalMinute: booking.arrivalMinute,
    handoverOutAt: booking.handoverOutAt,
    handoverInAt: booking.handoverInAt,
  });
};

export const compareStrings = (a?: string | null, b?: string | null) =>
  (a ?? '').localeCompare(b ?? '', 'hu', { sensitivity: 'base' });

export const getServiceRemainingKm = (vehicle: BookingCalendarVehicle) => {
  if (vehicle.serviceIntervalKm == null || vehicle.lastServiceMileage == null) {
    return null;
  }
  const nextDue = vehicle.lastServiceMileage + vehicle.serviceIntervalKm;
  const remaining = nextDue - (vehicle.odometer ?? 0);
  return Number.isFinite(remaining) ? remaining : null;
};

export const getLocationColor = (location?: string | null) => {
  if (!location) return '#888888';
  const match = location.match(/#(?:[0-9a-fA-F]{3}){1,2}$/);
  return match?.[0] ?? '#888888';
};

export const getLocationLabel = (location?: string | null) => {
  const trimmed = location?.trim();
  if (!trimmed) return 'Nincs megadva';
  const withoutColor = trimmed.replace(/\s*#(?:[0-9a-fA-F]{3}){1,2}\s*$/, '');
  const normalized = withoutColor.trim();
  return normalized || trimmed;
};

export const normalizeIsland = (value?: string | null) =>
  value
    ?.trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') ?? '';

export const getBookingIslandColor = (island?: string | null) => {
  const normalized = normalizeIsland(island);
  if (normalized.includes('lanzarote')) return '#0000ff';
  if (normalized.includes('fuerteventura')) return '#ffa500';
  return '#64748b';
};

export const getBookingIslandLabel = (island?: string | null) => {
  const normalized = normalizeIsland(island);
  if (normalized.includes('lanzarote')) return 'Lanzarote';
  if (normalized.includes('fuerteventura')) return 'Fuerteventura';
  return 'Ismeretlen sziget';
};
