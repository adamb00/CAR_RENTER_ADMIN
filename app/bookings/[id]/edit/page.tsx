import { notFound } from 'next/navigation';
import { Prisma } from '@prisma/client';

import {
  BookingAdminEditForm,
  type BookingAdminInitialData,
} from '@/components/booking-admin-edit-form';
import { getBookingById, getIsCarOut } from '@/data-service/bookings';
import { getArchivedBookingIdSet } from '@/lib/booking-archive';
import { isCancelledBookingStatus } from '@/lib/booking-conflicts';
import { db } from '@/lib/db';

const stringifyJson = (value: unknown) =>
  JSON.stringify(value ?? null, null, 2);
const toDateInputValue = (value?: Date | null) =>
  value ? value.toISOString().slice(0, 10) : '';
const toDateTimeInputValue = (value?: Date | null) =>
  value ? value.toISOString().slice(0, 16) : '';
const addUtcDays = (value: Date, days: number) =>
  new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate() + days,
    ),
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toOptionalTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const normalized = toOptionalTrimmedString(value);
    if (normalized) return normalized;
  }
  return undefined;
};

const toPayloadDateInput = (value: unknown): string | undefined => {
  const raw = toOptionalTrimmedString(value);
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
};

const toUtcDateFromDateInput = (value?: string): Date | null => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed;
};

const toOptionalIntegerString = (value: unknown): string | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(Math.trunc(value)) : undefined;
  }

  const raw = toOptionalTrimmedString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? String(Math.trunc(parsed)) : undefined;
};

const toAddressLineFromPayload = (value: unknown): string | undefined => {
  const direct = toOptionalTrimmedString(value);
  if (direct) return direct;
  if (!isRecord(value)) return undefined;

  const locality = [value.postalCode, value.city]
    .map((item) => toOptionalTrimmedString(item))
    .filter((item): item is string => Boolean(item))
    .join(' ');
  const street = [value.street, value.streetType, value.doorNumber]
    .map((item) => toOptionalTrimmedString(item))
    .filter((item): item is string => Boolean(item))
    .join(' ');
  const line = [locality, street, toOptionalTrimmedString(value.country)]
    .filter((item): item is string => Boolean(item))
    .join(', ');

  return line.length > 0 ? line : undefined;
};

const toDriverFormString = (value: unknown): string => {
  const normalized = toOptionalTrimmedString(value);
  return normalized ?? '';
};

const toAmountString = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'toString' in value) {
    const serialized = String((value as { toString: () => string }).toString());
    return serialized;
  }
  return '';
};

type BookingPricingSnapshotRow = {
  rentalFee: string | null;
  insurance: string | null;
  deposit: string | null;
  deliveryFee: string | null;
  extrasFee: string | null;
  tip: string | null;
};

type BookingDeliveryDetailsRow = {
  placeType: string | null;
  locationName: string | null;
  addressLine: string | null;
  island: string | null;
  arrivalFlight: string | null;
  departureFlight: string | null;
  arrivalHour: string | null;
  arrivalMinute: string | null;
};

type BookingHandoverCostRow = {
  direction: 'out' | 'in';
  costType: 'tip' | 'fuel' | 'ferry' | 'cleaning';
  amount: unknown;
};

export default async function BookingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: identifier } = await params;
  const normalized = await getBookingById(identifier);
  if (!normalized) notFound();

  const booking = await db.rentRequests.findUnique({
    where: { id: normalized.id },
  });
  if (!booking) {
    notFound();
  }

  const [
    pricingRows,
    deliveryRows,
    handoverCostRows,
    vehicleHandovers,
    bookingContract,
  ] = await Promise.all([
    db.$queryRaw<BookingPricingSnapshotRow[]>(
      Prisma.sql`
          SELECT
            "rentalFee",
            "insurance",
            "deposit",
            "deliveryFee",
            "extrasFee",
            "tip"
          FROM "BookingPricingSnapshots"
          WHERE "bookingId" = ${booking.id}::uuid
          LIMIT 1
        `,
    ),
    db.$queryRaw<BookingDeliveryDetailsRow[]>(
      Prisma.sql`
          SELECT
            "placeType",
            "locationName",
            "addressLine",
            "island",
            "arrivalFlight",
            "departureFlight",
            "arrivalHour",
            "arrivalMinute"
          FROM "BookingDeliveryDetails"
          WHERE "bookingId" = ${booking.id}::uuid
          LIMIT 1
        `,
    ),
    db.$queryRaw<BookingHandoverCostRow[]>(
      Prisma.sql`
          SELECT
            "direction",
            "costType",
            "amount"
          FROM "BookingHandoverCosts"
          WHERE "bookingId" = ${booking.id}::uuid
          ORDER BY "direction" ASC, "costType" ASC
        `,
    ),
    db.vehicleHandover.findMany({
      where: { bookingId: booking.id },
      orderBy: { handoverAt: 'asc' },
    }),
    db.bookingContract.findUnique({ where: { bookingId: booking.id } }),
  ]);

  const pricingSnapshot = pricingRows[0] ?? null;
  const deliveryDetails = deliveryRows[0] ?? null;
  const payload = isRecord(booking.payload) ? booking.payload : null;
  const payloadContact = payload && isRecord(payload.contact) ? payload.contact : null;
  const payloadRentalPeriod =
    payload && isRecord(payload.rentalPeriod) ? payload.rentalPeriod : null;
  const payloadPricing = payload && isRecord(payload.pricing) ? payload.pricing : null;
  const payloadDelivery =
    payload && isRecord(payload.delivery) ? payload.delivery : null;
  const payloadDriversRaw = Array.isArray(payload?.driver) ? payload.driver : [];
  const payloadDrivers = payloadDriversRaw.reduce<
    BookingAdminInitialData['drivers']
  >((acc, driver) => {
    if (!isRecord(driver)) return acc;
      const document = isRecord(driver.document) ? driver.document : null;
      const mapped = {
        firstName_1: toDriverFormString(driver.firstName_1),
        firstName_2: toDriverFormString(driver.firstName_2),
        lastName_1: toDriverFormString(driver.lastName_1),
        lastName_2: toDriverFormString(driver.lastName_2),
        phoneNumber: toDriverFormString(driver.phoneNumber),
        email: toDriverFormString(driver.email),
        dateOfBirth: toDriverFormString(driver.dateOfBirth),
        placeOfBirth: toDriverFormString(driver.placeOfBirth),
        documentType: toDriverFormString(document?.type),
        documentNumber: toDriverFormString(document?.number),
        drivingLicenceNumber: toDriverFormString(document?.drivingLicenceNumber),
      };
      if (Object.values(mapped).some((value) => value.trim().length > 0)) {
        acc.push(mapped);
      }
      return acc;
    }, []);
  const payloadRentalStart = toPayloadDateInput(payloadRentalPeriod?.startDate);
  const payloadRentalEnd = toPayloadDateInput(payloadRentalPeriod?.endDate);

  const effectiveCarId = firstString(booking.carid, payload?.carId) ?? '';
  const effectiveRentalEnd = booking.rentalend ?? toUtcDateFromDateInput(payloadRentalEnd);
  let maxExtendableRentalEnd = '';
  let nextCarBookingCode = '';

  if (effectiveCarId && effectiveRentalEnd) {
    const nextCarBookings = await db.rentRequests.findMany({
      where: {
        id: { not: booking.id },
        carid: effectiveCarId,
        rentalstart: {
          not: null,
          gt: effectiveRentalEnd,
        },
      },
      select: {
        id: true,
        humanId: true,
        rentalstart: true,
        status: true,
      },
      orderBy: { rentalstart: 'asc' },
    });

    const archivedIdSet = await getArchivedBookingIdSet(
      nextCarBookings.map((row) => row.id),
    );
    const nextBooking = nextCarBookings.find(
      (row) =>
        !archivedIdSet.has(row.id) &&
        !isCancelledBookingStatus(row.status) &&
        row.rentalstart,
    );

    if (nextBooking?.rentalstart) {
      maxExtendableRentalEnd = toDateInputValue(
        addUtcDays(nextBooking.rentalstart, -1),
      );
      nextCarBookingCode = nextBooking.humanId ?? nextBooking.id;
    }
  }

  const initial: BookingAdminInitialData = {
    id: booking.id,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    humanId: booking.humanId ?? '',
    locale: firstString(booking.locale, payload?.locale) ?? '',
    carId: effectiveCarId,
    quoteId: firstString(booking.quoteid, payload?.quoteId) ?? '',
    contactName: firstString(booking.contactname, payloadContact?.name) ?? '',
    contactEmail: firstString(booking.contactemail, payloadContact?.email) ?? '',
    contactPhone:
      firstString(
        booking.contactphone,
        payloadContact?.phoneNumber,
        payload?.contactPhone,
      ) ?? '',
    rentalStart: toDateInputValue(booking.rentalstart) || payloadRentalStart || '',
    rentalEnd: toDateInputValue(booking.rentalend) || payloadRentalEnd || '',
    originalRentalEnd:
      toDateInputValue(booking.rentalend) || payloadRentalEnd || '',
    maxExtendableRentalEnd,
    nextCarBookingCode,
    rentalDays:
      booking.rentaldays != null
        ? String(booking.rentaldays)
        : (toOptionalIntegerString(payload?.rentalDays) ?? ''),
    status: firstString(booking.status, payload?.status) ?? '',
    updatedNote: firstString(booking.updated, payload?.updatedNote) ?? '',
    payloadJson: stringifyJson(booking.payload),
    drivers: payloadDrivers,
    hasPricingSnapshot: Boolean(pricingSnapshot),
    pricingSnapshot: {
      rentalFee: firstString(pricingSnapshot?.rentalFee, payloadPricing?.rentalFee) ?? '',
      insurance: firstString(pricingSnapshot?.insurance, payloadPricing?.insurance) ?? '',
      deposit: firstString(pricingSnapshot?.deposit, payloadPricing?.deposit) ?? '',
      deliveryFee:
        firstString(pricingSnapshot?.deliveryFee, payloadPricing?.deliveryFee) ?? '',
      extrasFee:
        firstString(pricingSnapshot?.extrasFee, payloadPricing?.extrasFee) ?? '',
      tip: firstString(pricingSnapshot?.tip, payloadPricing?.tip) ?? '',
    },
    hasDeliveryDetails: Boolean(deliveryDetails),
    deliveryDetails: {
      placeType: firstString(deliveryDetails?.placeType, payloadDelivery?.placeType) ?? '',
      locationName:
        firstString(
          deliveryDetails?.locationName,
          payloadDelivery?.locationName,
          payloadPricing?.deliveryLocation,
        ) ?? '',
      addressLine:
        firstString(
          deliveryDetails?.addressLine,
          toAddressLineFromPayload(payloadDelivery?.address),
        ) ?? '',
      island: firstString(deliveryDetails?.island, payloadDelivery?.island) ?? '',
      arrivalFlight:
        firstString(deliveryDetails?.arrivalFlight, payloadDelivery?.arrivalFlight) ??
        '',
      departureFlight:
        firstString(
          deliveryDetails?.departureFlight,
          payloadDelivery?.departureFlight,
        ) ?? '',
      arrivalHour:
        firstString(deliveryDetails?.arrivalHour, payloadDelivery?.arrivalHour) ?? '',
      arrivalMinute:
        firstString(
          deliveryDetails?.arrivalMinute,
          payloadDelivery?.arrivalMinute,
        ) ?? '',
    },
    handoverCosts: handoverCostRows.map((row) => ({
      direction: row.direction,
      costType: row.costType,
      amount: toAmountString(row.amount),
    })),
    vehicleHandovers: vehicleHandovers.map((row) => ({
      fleetVehicleId: row.fleetVehicleId,
      direction: row.direction,
      handoverAt: toDateTimeInputValue(row.handoverAt),
      handoverBy: row.handoverBy ?? '',
      mileage: row.mileage != null ? String(row.mileage) : '',
      notes: row.notes ?? '',
      damages: row.damages ?? '',
      damagesImages: row.damagesImages.join('\n'),
    })),
    hasBookingContract: Boolean(bookingContract),
    bookingContract: {
      signerName: bookingContract?.signerName ?? '',
      signerEmail: bookingContract?.signerEmail ?? '',
      contractVersion: bookingContract?.contractVersion ?? '',
      contractText: bookingContract?.contractText ?? '',
      signatureData: bookingContract?.signatureData ?? '',
      lessorSignatureData: bookingContract?.lessorSignatureData ?? '',
      signedAt: toDateTimeInputValue(bookingContract?.signedAt),
      pdfSentAt: toDateTimeInputValue(bookingContract?.pdfSentAt),
    },
  };

  return (
    <div className='flex h-full flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Foglalás módosítása
        </h1>
        <p className='text-muted-foreground'>
          Teljes admin szerkesztés: foglalás, payload és kapcsolt táblák.
        </p>
      </div>
      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <BookingAdminEditForm initial={initial} />
      </div>
    </div>
  );
}
