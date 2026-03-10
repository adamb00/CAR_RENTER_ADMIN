export type BookingIntervalInput = {
  rentalStart?: Date | string | null;
  rentalEnd?: Date | string | null;
  arrivalHour?: string | number | null;
  arrivalMinute?: string | number | null;
  handoverOutAt?: Date | string | null;
  handoverInAt?: Date | string | null;
};

export type BookingInterval = {
  start: Date;
  end: Date;
};

export const DEFAULT_PICKUP_HOUR = 12;
export const DEFAULT_PICKUP_MINUTE = 0;
export const DEFAULT_RETURN_HOUR = 11;
export const DEFAULT_RETURN_MINUTE = 30;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const withUtcTime = (
  date: Date,
  hour: number,
  minute: number,
  second = 0,
  millisecond = 0,
) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hour,
      minute,
      second,
      millisecond,
    ),
  );

const toDateOnlyUtc = (value?: Date | string | null): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
      ),
    );
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = DATE_ONLY_PATTERN.exec(trimmed);
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

const toDateTime = (value?: Date | string | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toBoundedInteger = (
  value: string | number | null | undefined,
  min: number,
  max: number,
): number | null => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    const truncated = Math.trunc(value);
    return truncated >= min && truncated <= max ? truncated : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed >= min && parsed <= max ? parsed : null;
};

const isSameUtcDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

export const buildBookingInterval = (
  input: BookingIntervalInput,
): BookingInterval | null => {
  const rentalStartDate = toDateOnlyUtc(input.rentalStart);
  const rentalEndDate = toDateOnlyUtc(input.rentalEnd);
  if (!rentalStartDate || !rentalEndDate) return null;

  const pickupHour =
    toBoundedInteger(input.arrivalHour, 0, 23) ?? DEFAULT_PICKUP_HOUR;
  const pickupMinute =
    toBoundedInteger(input.arrivalMinute, 0, 59) ?? DEFAULT_PICKUP_MINUTE;
  const returnHour = DEFAULT_RETURN_HOUR;
  const returnMinute = DEFAULT_RETURN_MINUTE;

  const handoverOutAt = toDateTime(input.handoverOutAt);
  const handoverInAt = toDateTime(input.handoverInAt);

  const start =
    handoverOutAt && isSameUtcDay(handoverOutAt, rentalStartDate)
      ? handoverOutAt
      : withUtcTime(rentalStartDate, pickupHour, pickupMinute);

  const end =
    handoverInAt && isSameUtcDay(handoverInAt, rentalEndDate)
      ? handoverInAt
      : withUtcTime(rentalEndDate, returnHour, returnMinute);

  if (end.getTime() <= start.getTime()) {
    const fallbackEnd = withUtcTime(rentalEndDate, 23, 59, 59, 999);
    if (fallbackEnd.getTime() > start.getTime()) {
      return { start, end: fallbackEnd };
    }
    return { start, end: new Date(start.getTime() + 60 * 60 * 1000) };
  }

  return { start, end };
};

export const intervalsOverlap = (a: BookingInterval, b: BookingInterval) =>
  a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
