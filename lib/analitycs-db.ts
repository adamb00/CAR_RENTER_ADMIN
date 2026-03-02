import { Prisma } from '@prisma/client';

import { getArchivedBookingIdSet } from '@/lib/booking-archive';
import { RENT_STATUS_REGISTERED } from '@/lib/constants';
import { db } from '@/lib/db';
import { FLEET_NOTES_META_PREFIX } from '@/lib/fleet-service-window';

type NumericCellValue = number | string;

type BookingPricingSnapshotRow = {
  bookingId: string;
  rentalFee: string | null;
  insurance: string | null;
  deliveryFee: string | null;
  tip: string | null;
};

type BookingHandoverCostRow = {
  bookingId: string;
  direction: 'out' | 'in';
  costType: 'tip' | 'fuel' | 'ferry' | 'cleaning';
  amount: unknown;
};

export type AnalitycsBookingRow = {
  rowNumber: number;
  bookingId: string;
  bookingCode: string;
  status: string;
  carLabel: string;
  plate: string;
  rentalStart: string;
  rentalEnd: string;
  rentalDays: number;
  carriedDays: number;
  currentMonthDays: number;
  dailyFee: NumericCellValue;
  rentalFee: number;
  insurance: number;
  delivery: number;
  tip: number;
  fuelCost: number;
  ferryCost: number;
  cleaningCost: number;
  revenue: number;
};

export type AnalitycsCarBreakdown = {
  plate: string;
  rows: number;
  rentalDays: number;
  carriedDays: number;
  currentMonthDays: number;
  rentalFee: number;
  insurance: number;
  delivery: number;
  tip: number;
  revenue: number;
};

export type AnalitycsMonthData = {
  monthKey: string;
  monthLabel: string;
  monthStart: string;
  monthEnd: string;
  daysInMonth: number;
  rowCount: number;
  rows: AnalitycsBookingRow[];
  perCar: AnalitycsCarBreakdown[];
  archiveSummary: {
    totalBookings: number;
    activeCount: number;
    archivedCount: number;
    activeRevenue: number;
    archivedRevenue: number;
    archivedShare: number;
  };
  quoteConversion: {
    totalOffers: number;
    convertedOffers: number;
    notConvertedOffers: number;
    conversionRate: number;
    registeredBookings: number;
  };
  totals: {
    carriedDays: number;
    totalRentalDays: number;
    rentalFee: number;
    insurance: number;
    delivery: number;
    tip: number;
    fuelCost: number;
    ferryCost: number;
    cleaningCost: number;
    revenue: number;
    effectiveDays: number;
    fleetCars: number;
    daysPerCar: number;
    monthCapacity: number;
    utilization: number;
    service: number;
    expense: number;
    result: number;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseAmount = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  let text = toTrimmedString(value);
  if (
    !text &&
    typeof value === 'object' &&
    value !== null &&
    'toString' in value &&
    typeof (value as { toString: () => string }).toString === 'function'
  ) {
    const serialized = (value as { toString: () => string }).toString();
    text = toTrimmedString(serialized);
  }
  if (!text) return 0;

  const raw = text.replace(/[^\d,.-]/g, '');
  if (!raw) return 0;

  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');
  const decimalSeparator =
    lastComma > lastDot ? ',' : lastDot > lastComma ? '.' : '';

  let normalized = raw;
  if (decimalSeparator) {
    const parts = raw.split(decimalSeparator);
    const decimal = parts.pop() ?? '';
    const integer = parts.join('').replace(/[.,]/g, '');
    normalized = `${integer}.${decimal}`;
  } else {
    normalized = raw.replace(/[.,]/g, '');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

type FleetServiceCostEntry = {
  serviceDate: string;
  serviceFee: number;
};

const parseIsoDateUtc = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day));
};

const parseFleetServiceCostsFromNotes = (
  notes?: string | null,
): FleetServiceCostEntry[] => {
  if (!notes || !notes.startsWith(FLEET_NOTES_META_PREFIX)) return [];

  try {
    const payload = JSON.parse(notes.slice(FLEET_NOTES_META_PREFIX.length)) as {
      serviceCosts?: unknown[];
    };

    if (!Array.isArray(payload?.serviceCosts)) return [];

    return payload.serviceCosts
      .map((entry) => {
        if (!isRecord(entry)) return null;
        const serviceDate = toTrimmedString(entry.serviceDate);
        const rawServiceFee = entry.serviceFee;
        if (
          rawServiceFee == null ||
          (typeof rawServiceFee === 'string' && rawServiceFee.trim().length === 0)
        ) {
          return null;
        }
        const serviceFee = parseAmount(rawServiceFee);
        if (!serviceDate) return null;
        if (!parseIsoDateUtc(serviceDate)) return null;
        if (!Number.isFinite(serviceFee) || serviceFee < 0) return null;
        return { serviceDate, serviceFee };
      })
      .filter((entry): entry is FleetServiceCostEntry => Boolean(entry));
  } catch {
    return [];
  }
};

const sumMonthServiceCosts = (
  notes: string | null | undefined,
  monthStart: Date,
  monthEnd: Date,
): number => {
  const entries = parseFleetServiceCostsFromNotes(notes);
  return entries.reduce((total, entry) => {
    const entryDate = parseIsoDateUtc(entry.serviceDate);
    if (!entryDate) return total;
    if (entryDate < monthStart || entryDate > monthEnd) return total;
    return total + entry.serviceFee;
  }, 0);
};

const toDateOnlyUtc = (value: Date): Date =>
  new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );

const toIsoDate = (value: Date): string => value.toISOString().slice(0, 10);

const daysInclusive = (start: Date, end: Date): number => {
  if (end.getTime() < start.getTime()) return 0;
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
};

const overlapDays = (
  rangeStart: Date,
  rangeEnd: Date,
  monthStart: Date,
  monthEnd: Date,
): number => {
  const effectiveStart =
    rangeStart.getTime() > monthStart.getTime() ? rangeStart : monthStart;
  const effectiveEnd =
    rangeEnd.getTime() < monthEnd.getTime() ? rangeEnd : monthEnd;

  return daysInclusive(effectiveStart, effectiveEnd);
};

const daysBeforeMonth = (
  rangeStart: Date,
  rangeEnd: Date,
  monthStart: Date,
): number => {
  const previousMonthEnd = new Date(
    Date.UTC(
      monthStart.getUTCFullYear(),
      monthStart.getUTCMonth(),
      monthStart.getUTCDate() - 1,
    ),
  );

  const effectiveEnd =
    rangeEnd.getTime() < previousMonthEnd.getTime() ? rangeEnd : previousMonthEnd;

  return daysInclusive(rangeStart, effectiveEnd);
};

const daysAfterMonth = (
  rangeStart: Date,
  rangeEnd: Date,
  monthEnd: Date,
): number => {
  const nextMonthStart = new Date(
    Date.UTC(
      monthEnd.getUTCFullYear(),
      monthEnd.getUTCMonth(),
      monthEnd.getUTCDate() + 1,
    ),
  );

  const effectiveStart =
    rangeStart.getTime() > nextMonthStart.getTime()
      ? rangeStart
      : nextMonthStart;

  return daysInclusive(effectiveStart, rangeEnd);
};

const normalizeInsuranceSelection = (value: unknown): string | null => {
  const text = toTrimmedString(value);
  if (!text) return null;

  const lowered = text.toLowerCase();
  if (
    lowered === 'false' ||
    lowered === '0' ||
    lowered === 'nem' ||
    lowered === 'no'
  ) {
    return null;
  }

  return text;
};

const normalizeBoolean = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;

  const text = toTrimmedString(value)?.toLowerCase();
  if (!text) return null;
  if (['true', '1', 'igen', 'yes'].includes(text)) return true;
  if (['false', '0', 'nem', 'no'].includes(text)) return false;

  return null;
};

const flattenQuoteEntries = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenQuoteEntries(item));
  }

  if (isRecord(value)) {
    return [value];
  }

  return [];
};

const selectQuotePricing = (
  bookingRequestData: unknown,
  carId?: string | null,
  offerAccepted?: number | null,
): Record<string, unknown> | null => {
  const entries = flattenQuoteEntries(bookingRequestData);
  if (entries.length === 0) return null;

  if (carId) {
    const matchingCar = entries.find((entry) => {
      const entryCarId = toTrimmedString(entry.carId);
      return entryCarId === carId;
    });

    if (matchingCar) {
      return matchingCar;
    }
  }

  const preferredIndex =
    typeof offerAccepted === 'number' &&
    Number.isFinite(offerAccepted) &&
    offerAccepted >= 0
      ? Math.floor(offerAccepted)
      : 0;

  return entries[preferredIndex] ?? entries[0] ?? null;
};

const resolvePlate = ({
  payload,
  handoverPlate,
  assignedFleetVehicleId,
  fleetPlateById,
  fallback,
}: {
  payload: Prisma.JsonValue | null;
  handoverPlate?: string;
  assignedFleetVehicleId?: string;
  fleetPlateById: Map<string, string>;
  fallback: string;
}): string => {
  if (isRecord(payload)) {
    const payloadPlate = toTrimmedString(payload.assignedFleetPlate);
    if (payloadPlate) return payloadPlate;
  }

  if (handoverPlate) return handoverPlate;

  if (assignedFleetVehicleId) {
    const mapped = fleetPlateById.get(assignedFleetVehicleId);
    if (mapped) return mapped;
  }

  return fallback;
};

const toMonthKey = (value: Date) =>
  `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;

const resolveMonthReference = (
  reference: Date,
  monthKey?: string | null,
): Date => {
  const trimmed = monthKey?.trim();
  if (!trimmed) return reference;

  const match = trimmed.match(MONTH_KEY_PATTERN);
  if (!match) return reference;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1;

  return new Date(Date.UTC(year, month, 1));
};

const getMonthBoundsUtc = (reference = new Date(), monthKey?: string | null) => {
  const resolvedReference = resolveMonthReference(reference, monthKey);
  const year = resolvedReference.getUTCFullYear();
  const month = resolvedReference.getUTCMonth();

  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));

  return {
    monthKey: toMonthKey(monthStart),
    monthStart,
    monthEnd,
    daysInMonth: monthEnd.getUTCDate(),
    monthLabel: monthStart.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }),
  };
};

export async function getCurrentMonthAnalitycs(
  monthKey?: string | null,
): Promise<AnalitycsMonthData> {
  const { monthKey: resolvedMonthKey, monthStart, monthEnd, daysInMonth, monthLabel } =
    getMonthBoundsUtc(new Date(), monthKey);
  const monthEndExclusive = new Date(
    Date.UTC(
      monthEnd.getUTCFullYear(),
      monthEnd.getUTCMonth(),
      monthEnd.getUTCDate() + 1,
    ),
  );

  const [bookings, monthQuotes] = await Promise.all([
    db.rentRequests.findMany({
      where: {
        rentalstart: { lte: monthEnd },
        rentalend: { gte: monthStart },
      },
      select: {
        id: true,
        humanId: true,
        status: true,
        carid: true,
        payload: true,
        rentalstart: true,
        rentalend: true,
        ContactQuotes: {
          select: {
            bookingRequestData: true,
            offerAccepted: true,
          },
        },
        vehicleHandovers: {
          where: { direction: 'out' },
          orderBy: { handoverAt: 'asc' },
          select: {
            fleetVehicle: {
              select: { plate: true },
            },
          },
        },
      },
      orderBy: [{ rentalstart: 'asc' }, { createdAt: 'asc' }],
    }),
    db.contactQuotes.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lt: monthEndExclusive,
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  const monthQuoteIds = monthQuotes.map((quote) => quote.id);
  const registeredBookingsFromOffers = monthQuoteIds.length
    ? await db.rentRequests.findMany({
        where: {
          quoteid: { in: monthQuoteIds },
          status: RENT_STATUS_REGISTERED,
        },
        select: {
          id: true,
          quoteid: true,
        },
      })
    : [];
  const archivedBookingIdSet = await getArchivedBookingIdSet([
    ...bookings.map((booking) => booking.id),
    ...registeredBookingsFromOffers.map((booking) => booking.id),
  ]);
  const activeBookings = bookings.filter(
    (booking) =>
      !archivedBookingIdSet.has(booking.id) &&
      booking.status === RENT_STATUS_REGISTERED,
  );
  const archivedBookings = bookings.filter((booking) =>
    archivedBookingIdSet.has(booking.id),
  );
  const activeRegisteredBookingsFromOffers = registeredBookingsFromOffers.filter(
    (booking) => !archivedBookingIdSet.has(booking.id),
  );

  const convertedQuoteIds = new Set(
    activeRegisteredBookingsFromOffers
      .map((booking) => booking.quoteid)
      .filter((quoteId): quoteId is string => Boolean(quoteId)),
  );
  const totalOffers = monthQuoteIds.length;
  const convertedOffers = convertedQuoteIds.size;
  const notConvertedOffers = Math.max(0, totalOffers - convertedOffers);
  const conversionRate =
    totalOffers > 0 ? (convertedOffers / totalOffers) * 100 : 0;
  const bookingIds = bookings.map((booking) => booking.id);

  const carIds = Array.from(
    new Set(
      bookings
        .map((booking) => booking.carid)
        .filter((carId): carId is string => Boolean(carId)),
    ),
  );

  const [cars, fleetVehicles, pricingSnapshots, handoverCostRows] =
    await Promise.all([
    carIds.length
      ? db.car.findMany({
          where: { id: { in: carIds } },
          select: { id: true, manufacturer: true, model: true },
        })
      : Promise.resolve([]),
    db.fleetVehicle.findMany({
      select: { id: true, plate: true, notes: true },
      orderBy: { plate: 'asc' },
    }),
    bookingIds.length
      ? db.$queryRaw<BookingPricingSnapshotRow[]>(
          Prisma.sql`
            SELECT
              "bookingId",
              "rentalFee",
              "insurance",
              "deliveryFee",
              "tip"
            FROM "BookingPricingSnapshots"
            WHERE "bookingId" IN (${Prisma.join(
              bookingIds.map((id) => Prisma.sql`${id}::uuid`),
            )})
          `,
        ).catch(() => [])
      : Promise.resolve([]),
    bookingIds.length
      ? db.$queryRaw<BookingHandoverCostRow[]>(
          Prisma.sql`
            SELECT
              "bookingId",
              "direction",
              "costType",
              "amount"
            FROM "BookingHandoverCosts"
            WHERE "bookingId" IN (${Prisma.join(
              bookingIds.map((id) => Prisma.sql`${id}::uuid`),
            )})
          `,
        ).catch(() => [])
      : Promise.resolve([]),
  ]);

  const pricingByBookingId = new Map(
    pricingSnapshots.map((snapshot) => [snapshot.bookingId, snapshot]),
  );
  const handoverCostsByBookingId = new Map<string, BookingHandoverCostRow[]>();
  for (const row of handoverCostRows) {
    const previous = handoverCostsByBookingId.get(row.bookingId) ?? [];
    previous.push(row);
    handoverCostsByBookingId.set(row.bookingId, previous);
  }

  const monthServiceCosts = fleetVehicles.reduce(
    (total, vehicle) =>
      total + sumMonthServiceCosts(vehicle.notes, monthStart, monthEnd),
    0,
  );

  const carLabelById = new Map(
    cars.map((car) => [car.id, `${car.manufacturer} ${car.model}`.trim()]),
  );

  const fleetPlateById = new Map(
    fleetVehicles.map((vehicle) => [vehicle.id, vehicle.plate]),
  );
  const fleetPlateSet = new Set(fleetVehicles.map((vehicle) => vehicle.plate));
  const fleetCars = fleetVehicles.length;

  const buildRowsWithoutIndex = (
    sourceBookings: typeof bookings,
  ): Array<Omit<AnalitycsBookingRow, 'rowNumber'>> =>
    sourceBookings.flatMap((booking) => {
      if (!booking.rentalstart || !booking.rentalend) {
        return [];
      }

      const rentalStart = toDateOnlyUtc(booking.rentalstart);
      const rentalEnd = toDateOnlyUtc(booking.rentalend);

      const currentMonthDays = overlapDays(
        rentalStart,
        rentalEnd,
        monthStart,
        monthEnd,
      );

      if (currentMonthDays <= 0) {
        return [];
      }

      const previousMonthDays = daysBeforeMonth(rentalStart, rentalEnd, monthStart);
      const nextMonthDays = daysAfterMonth(rentalStart, rentalEnd, monthEnd);

      // Ha előző hónapból csúszik át, akkor az "aktuális" az előző hónap része,
      // az "átvitt" pedig a kiválasztott hónapba áthozott rész.
      // Egyébként az "aktuális" a kiválasztott hónap része, az "átvitt" pedig a következő hónap.
      const activeDays = previousMonthDays > 0 ? previousMonthDays : currentMonthDays;
      const carriedDays = previousMonthDays > 0 ? currentMonthDays : nextMonthDays;
      const totalRentalDays = activeDays + carriedDays;

      const payloadPricing =
        isRecord(booking.payload) && isRecord(booking.payload.pricing)
          ? booking.payload.pricing
          : null;
      const snapshotPricing = pricingByBookingId.get(booking.id) ?? null;
      const pricingSource = snapshotPricing ?? payloadPricing;
      const payloadTip = isRecord(booking.payload)
        ? booking.payload.handoverTip
        : null;
      const payloadHandoverCosts =
        isRecord(booking.payload) && isRecord(booking.payload.handoverCosts)
          ? booking.payload.handoverCosts
          : null;
      const payloadOutCosts =
        payloadHandoverCosts && isRecord(payloadHandoverCosts.out)
          ? payloadHandoverCosts.out
          : null;
      const payloadInCosts =
        payloadHandoverCosts && isRecord(payloadHandoverCosts.in)
          ? payloadHandoverCosts.in
          : null;
      const bookingHandoverCosts =
        handoverCostsByBookingId.get(booking.id) ?? [];
      const handoverCostsMap = new Map<string, number>();
      for (const handoverCost of bookingHandoverCosts) {
        const key = `${handoverCost.direction}:${handoverCost.costType}`;
        handoverCostsMap.set(key, parseAmount(handoverCost.amount));
      }
      const hasHandoverCostRows = handoverCostsMap.size > 0;

      const quotePricing = selectQuotePricing(
        booking.ContactQuotes?.bookingRequestData,
        booking.carid,
        booking.ContactQuotes?.offerAccepted,
      );

      const rentalFee = parseAmount(
        pricingSource?.rentalFee ?? quotePricing?.rentalFee,
      );
      const delivery = parseAmount(
        pricingSource?.deliveryFee ?? quotePricing?.deliveryFee,
      );

      const insuranceRaw =
        pricingSource?.insurance ?? quotePricing?.insurance ?? null;

      const insuranceConsent =
        isRecord(booking.payload) && isRecord(booking.payload.consents)
          ? normalizeBoolean(booking.payload.consents.insurance)
          : null;

      const normalizedInsurance = normalizeInsuranceSelection(insuranceRaw);
      const hasInsurance =
        insuranceConsent != null
          ? insuranceConsent
          : Boolean(normalizedInsurance);

      const insurance = hasInsurance ? parseAmount(normalizedInsurance) : 0;
      const hasTipCostRow = handoverCostsMap.has('out:tip');
      const tipFromCosts = handoverCostsMap.get('out:tip') ?? 0;

      const tip = parseAmount(
        hasTipCostRow
          ? tipFromCosts
          : payloadTip ??
              pricingSource?.tip ??
              quotePricing?.tip ??
              payloadPricing?.discount ??
              quotePricing?.discount,
      );
      const fuelCost = hasHandoverCostRows
        ? (handoverCostsMap.get('out:fuel') ?? 0) +
          (handoverCostsMap.get('in:fuel') ?? 0)
        : parseAmount(payloadOutCosts?.fuelCost) +
          parseAmount(payloadInCosts?.fuelCost);
      const ferryCost = hasHandoverCostRows
        ? (handoverCostsMap.get('out:ferry') ?? 0) +
          (handoverCostsMap.get('in:ferry') ?? 0)
        : parseAmount(payloadOutCosts?.ferryCost) +
          parseAmount(payloadInCosts?.ferryCost);
      const cleaningCost = hasHandoverCostRows
        ? (handoverCostsMap.get('out:cleaning') ?? 0) +
          (handoverCostsMap.get('in:cleaning') ?? 0)
        : parseAmount(payloadOutCosts?.cleaningCost) +
          parseAmount(payloadInCosts?.cleaningCost);

      const revenue = rentalFee + insurance + delivery - tip;

      const assignedFleetVehicleId = isRecord(booking.payload)
        ? toTrimmedString(booking.payload.assignedFleetVehicleId)
        : undefined;

      const handoverPlate =
        booking.vehicleHandovers[0]?.fleetVehicle.plate ?? undefined;

      const carLabel =
        (booking.carid ? carLabelById.get(booking.carid) : undefined) ??
        booking.carid ??
        'Nincs hozzárendelve';

      const plate = resolvePlate({
        payload: booking.payload,
        handoverPlate,
        assignedFleetVehicleId,
        fleetPlateById,
        fallback: carLabel,
      });

      const dailyFee: NumericCellValue =
        totalRentalDays > 0 ? rentalFee / totalRentalDays : '#DIV/0!';

      return [
        {
          bookingId: booking.id,
          bookingCode: booking.humanId ?? booking.id,
          status: booking.status ?? 'ismeretlen',
          carLabel,
          plate,
          rentalStart: toIsoDate(rentalStart),
          rentalEnd: toIsoDate(rentalEnd),
          rentalDays: totalRentalDays,
          carriedDays,
          currentMonthDays: activeDays,
          dailyFee,
          rentalFee,
          insurance,
          delivery,
          tip,
          fuelCost,
          ferryCost,
          cleaningCost,
          revenue,
        },
      ];
    });

  const rowsWithoutIndex = buildRowsWithoutIndex(activeBookings);
  const archivedRowsWithoutIndex = buildRowsWithoutIndex(archivedBookings);

  const rows: AnalitycsBookingRow[] = rowsWithoutIndex.map((row, index) => ({
    ...row,
    rowNumber: index + 2,
  }));

  const totals = rows.reduce(
    (acc, row) => {
      acc.carriedDays += row.carriedDays;
      acc.totalRentalDays += row.rentalDays;
      acc.rentalFee += row.rentalFee;
      acc.insurance += row.insurance;
      acc.delivery += row.delivery;
      acc.tip += row.tip;
      acc.fuelCost += row.fuelCost;
      acc.ferryCost += row.ferryCost;
      acc.cleaningCost += row.cleaningCost;
      acc.revenue += row.revenue;
      return acc;
    },
    {
      carriedDays: 0,
      totalRentalDays: 0,
      rentalFee: 0,
      insurance: 0,
      delivery: 0,
      tip: 0,
      fuelCost: 0,
      ferryCost: 0,
      cleaningCost: 0,
      revenue: 0,
    },
  );

  const effectiveDays = totals.totalRentalDays;
  const daysPerCar = daysInMonth;
  const monthCapacity = fleetCars * daysPerCar - fleetCars * 4;
  const utilization =
    monthCapacity > 0 ? effectiveDays / (monthCapacity / 100) : 0;
  const service = monthServiceCosts;
  const expense = service + totals.fuelCost + totals.ferryCost + totals.cleaningCost;
  const result = totals.revenue - expense;
  const activeCount = rowsWithoutIndex.length;
  const archivedCount = archivedRowsWithoutIndex.length;
  const totalBookings = activeCount + archivedCount;
  const archivedRevenue = archivedRowsWithoutIndex.reduce(
    (sum, row) => sum + row.revenue,
    0,
  );
  const archivedShare =
    totalBookings > 0 ? (archivedCount / totalBookings) * 100 : 0;

  const perCarMap = new Map<string, AnalitycsCarBreakdown>(
    fleetVehicles.map((vehicle) => [
      vehicle.plate,
      {
        plate: vehicle.plate,
        rows: 0,
        rentalDays: 0,
        carriedDays: 0,
        currentMonthDays: 0,
        rentalFee: 0,
        insurance: 0,
        delivery: 0,
        tip: 0,
        revenue: 0,
      },
    ]),
  );

  for (const row of rows) {
    if (!fleetPlateSet.has(row.plate)) {
      continue;
    }

    const previous = perCarMap.get(row.plate) ?? {
      plate: row.plate,
      rows: 0,
      rentalDays: 0,
      carriedDays: 0,
      currentMonthDays: 0,
      rentalFee: 0,
      insurance: 0,
      delivery: 0,
      tip: 0,
      revenue: 0,
    };

    previous.rows += 1;
    previous.rentalDays += row.rentalDays;
    previous.carriedDays += row.carriedDays;
    previous.currentMonthDays += row.currentMonthDays;
    previous.rentalFee += row.rentalFee;
    previous.insurance += row.insurance;
    previous.delivery += row.delivery;
    previous.tip += row.tip;
    previous.revenue += row.revenue;

    perCarMap.set(row.plate, previous);
  }

  const perCar = [...perCarMap.values()].sort((a, b) =>
    a.plate.localeCompare(b.plate, 'hu-HU'),
  );

  return {
    monthKey: resolvedMonthKey,
    monthLabel,
    monthStart: toIsoDate(monthStart),
    monthEnd: toIsoDate(monthEnd),
    daysInMonth,
    rowCount: rows.length,
    rows,
    perCar,
    archiveSummary: {
      totalBookings,
      activeCount,
      archivedCount,
      activeRevenue: totals.revenue,
      archivedRevenue,
      archivedShare,
    },
    quoteConversion: {
      totalOffers,
      convertedOffers,
      notConvertedOffers,
      conversionRate,
      registeredBookings: registeredBookingsFromOffers.length,
    },
    totals: {
      ...totals,
      effectiveDays,
      fleetCars,
      daysPerCar,
      monthCapacity,
      utilization,
      service,
      expense,
      result,
    },
  };
}
