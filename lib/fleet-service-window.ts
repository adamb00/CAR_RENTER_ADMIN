export const FLEET_NOTES_META_PREFIX = '__FLEET_META_V1__:';

type FleetServiceWindow = {
  nextServiceFrom: string;
  nextServiceTo: string;
};

const EMPTY_WINDOW: FleetServiceWindow = {
  nextServiceFrom: '',
  nextServiceTo: '',
};

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const parseIsoDateStart = (value: string): Date | null => {
  if (!isIsoDate(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTodayIso = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeFleetServiceWindow = (
  nextServiceFrom?: string | null,
  nextServiceTo?: string | null,
  referenceDate = new Date(),
): FleetServiceWindow => {
  const fromRaw = (nextServiceFrom ?? '').trim();
  const toRaw = (nextServiceTo ?? '').trim();
  if (!fromRaw || !toRaw) return EMPTY_WINDOW;

  const fromDate = parseIsoDateStart(fromRaw);
  const toDate = parseIsoDateStart(toRaw);
  if (!fromDate || !toDate) return EMPTY_WINDOW;
  if (toDate < fromDate) return EMPTY_WINDOW;

  const today = parseIsoDateStart(formatTodayIso(referenceDate));
  if (!today) return EMPTY_WINDOW;
  if (today >= toDate) return EMPTY_WINDOW;

  return { nextServiceFrom: fromRaw, nextServiceTo: toRaw };
};

export const extractFleetServiceWindowFromNotes = (
  notes?: string | null,
  referenceDate = new Date(),
): FleetServiceWindow => {
  if (!notes || !notes.startsWith(FLEET_NOTES_META_PREFIX)) return EMPTY_WINDOW;
  try {
    const payload = JSON.parse(notes.slice(FLEET_NOTES_META_PREFIX.length)) as {
      nextServiceFrom?: unknown;
      nextServiceTo?: unknown;
    };
    const nextServiceFrom =
      typeof payload?.nextServiceFrom === 'string' ? payload.nextServiceFrom : '';
    const nextServiceTo =
      typeof payload?.nextServiceTo === 'string' ? payload.nextServiceTo : '';
    return normalizeFleetServiceWindow(
      nextServiceFrom,
      nextServiceTo,
      referenceDate,
    );
  } catch {
    return EMPTY_WINDOW;
  }
};

const rangesOverlap = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) => startA <= endB && endA >= startB;

export const getFleetServiceWindowRangeFromNotes = (
  notes?: string | null,
  referenceDate = new Date(),
) => {
  const window = extractFleetServiceWindowFromNotes(notes, referenceDate);
  if (!window.nextServiceFrom || !window.nextServiceTo) return null;
  const from = parseIsoDateStart(window.nextServiceFrom);
  const to = parseIsoDateStart(window.nextServiceTo);
  if (!from || !to) return null;
  return {
    from,
    to,
    fromLabel: window.nextServiceFrom,
    toLabel: window.nextServiceTo,
  };
};

export const isFleetBlockedByServiceWindow = ({
  notes,
  rentalStart,
  rentalEnd,
  referenceDate,
}: {
  notes?: string | null;
  rentalStart?: Date | null;
  rentalEnd?: Date | null;
  referenceDate?: Date;
}) => {
  if (!rentalStart || !rentalEnd) return false;
  const window = getFleetServiceWindowRangeFromNotes(notes, referenceDate);
  if (!window) return false;
  return rangesOverlap(rentalStart, rentalEnd, window.from, window.to);
};
