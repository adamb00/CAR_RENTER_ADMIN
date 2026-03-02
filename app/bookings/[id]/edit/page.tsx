import { notFound } from 'next/navigation';
import { Prisma } from '@prisma/client';

import {
  BookingAdminEditForm,
  type BookingAdminInitialData,
} from '@/components/booking-admin-edit-form';
import { getBookingById } from '@/data-service/bookings';
import { getArchivedBookingIdSet } from '@/lib/booking-archive';
import { db } from '@/lib/db';

const stringifyJson = (value: unknown) => JSON.stringify(value ?? null, null, 2);
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

  const booking = await db.rentRequests.findUnique({ where: { id: normalized.id } });
  if (!booking) {
    notFound();
  }

  const [pricingRows, deliveryRows, handoverCostRows, vehicleHandovers, bookingContract] =
    await Promise.all([
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
  let maxExtendableRentalEnd = '';
  let nextCarBookingCode = '';

  if (booking.carid && booking.rentalend) {
    const nextCarBookings = await db.rentRequests.findMany({
      where: {
        id: { not: booking.id },
        carid: booking.carid,
        rentalstart: {
          not: null,
          gt: booking.rentalend,
        },
      },
      select: {
        id: true,
        humanId: true,
        rentalstart: true,
      },
      orderBy: { rentalstart: 'asc' },
    });

    const archivedIdSet = await getArchivedBookingIdSet(
      nextCarBookings.map((row) => row.id),
    );
    const nextBooking = nextCarBookings.find(
      (row) => !archivedIdSet.has(row.id) && row.rentalstart,
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
    locale: booking.locale ?? '',
    carId: booking.carid ?? '',
    quoteId: booking.quoteid ?? '',
    contactName: booking.contactname ?? '',
    contactEmail: booking.contactemail ?? '',
    contactPhone: booking.contactphone ?? '',
    rentalStart: toDateInputValue(booking.rentalstart),
    rentalEnd: toDateInputValue(booking.rentalend),
    originalRentalEnd: toDateInputValue(booking.rentalend),
    maxExtendableRentalEnd,
    nextCarBookingCode,
    rentalDays: booking.rentaldays != null ? String(booking.rentaldays) : '',
    status: booking.status ?? '',
    updatedNote: booking.updated ?? '',
    payloadJson: stringifyJson(booking.payload),
    hasPricingSnapshot: Boolean(pricingSnapshot),
    pricingSnapshot: {
      rentalFee: pricingSnapshot?.rentalFee ?? '',
      insurance: pricingSnapshot?.insurance ?? '',
      deposit: pricingSnapshot?.deposit ?? '',
      deliveryFee: pricingSnapshot?.deliveryFee ?? '',
      extrasFee: pricingSnapshot?.extrasFee ?? '',
      tip: pricingSnapshot?.tip ?? '',
    },
    hasDeliveryDetails: Boolean(deliveryDetails),
    deliveryDetails: {
      placeType: deliveryDetails?.placeType ?? '',
      locationName: deliveryDetails?.locationName ?? '',
      addressLine: deliveryDetails?.addressLine ?? '',
      arrivalFlight: deliveryDetails?.arrivalFlight ?? '',
      departureFlight: deliveryDetails?.departureFlight ?? '',
      arrivalHour: deliveryDetails?.arrivalHour ?? '',
      arrivalMinute: deliveryDetails?.arrivalMinute ?? '',
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
