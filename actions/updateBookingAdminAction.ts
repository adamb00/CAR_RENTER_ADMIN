'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import {
  findCarBookingConflict,
  formatDateForConflictMessage,
  getAssignedFleetPlateFromPayload,
  getAssignedFleetVehicleIdFromPayload,
  hasAssignedFleetAssignment,
} from '@/lib/booking-conflicts';
import { RENT_STATUS_REGISTERED } from '@/lib/constants';
import { db } from '@/lib/db';
import { resolveDeliveryIsland } from '@/lib/delivery-island';

type UpdateBookingAdminInput = {
  bookingId: string;
  humanId?: string;
  locale?: string;
  carId?: string;
  quoteId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  rentalStart?: string;
  rentalEnd?: string;
  rentalDays?: string;
  status?: string;
  updatedNote?: string;
  payloadJson?: string;
  pricingSnapshotJson?: string;
  deliveryDetailsJson?: string;
  handoverCostsJson?: string;
  vehicleHandoversJson?: string;
  bookingContractJson?: string;
};

type UpdateBookingAdminResult = {
  success?: string;
  error?: string;
};

type HandoverDirectionValue = 'out' | 'in';
type HandoverCostTypeValue = 'tip' | 'fuel' | 'ferry' | 'cleaning';

type BookingPricingSnapshotInput = {
  rentalFee?: unknown;
  insurance?: unknown;
  deposit?: unknown;
  deliveryFee?: unknown;
  extrasFee?: unknown;
  tip?: unknown;
};

type BookingDeliveryDetailsInput = {
  placeType?: unknown;
  locationName?: unknown;
  addressLine?: unknown;
  arrivalFlight?: unknown;
  departureFlight?: unknown;
  arrivalHour?: unknown;
  arrivalMinute?: unknown;
};

type BookingContractInput = {
  signerName?: unknown;
  signerEmail?: unknown;
  contractVersion?: unknown;
  contractText?: unknown;
  signatureData?: unknown;
  lessorSignatureData?: unknown;
  signedAt?: unknown;
  pdfSentAt?: unknown;
};

const COST_TYPES: HandoverCostTypeValue[] = ['tip', 'fuel', 'ferry', 'cleaning'];
const DIRECTIONS: HandoverDirectionValue[] = ['out', 'in'];

const toOptionalString = (value?: string | null) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseDateOrNull = (value?: string) => {
  const trimmed = toOptionalString(value);
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseIntegerOrNull = (value?: string) => {
  const trimmed = toOptionalString(value);
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const toRecordOrNull = <T extends Record<string, unknown>>(
  value: unknown,
): T | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as T;
};

const parseJson = <T,>(label: string, raw?: string): { data?: T; error?: string } => {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { data: null as T };
  try {
    return { data: JSON.parse(trimmed) as T };
  } catch {
    return { error: `${label} JSON formátuma érvénytelen.` };
  }
};

const stripAssignedFleetFromPayload = (
  payload: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | null => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    return payload ?? null;
  }

  const record = { ...(payload as Record<string, unknown>) };
  delete record.assignedFleetVehicleId;
  delete record.assignedFleetPlate;
  return record as Prisma.InputJsonValue;
};

export const updateBookingAdminAction = async (
  input: UpdateBookingAdminInput,
): Promise<UpdateBookingAdminResult> => {
  const bookingId = input.bookingId?.trim();
  if (!bookingId) return { error: 'Hiányzó foglalás azonosító.' };

  const booking = await db.rentRequests.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      carid: true,
      rentalstart: true,
      rentalend: true,
      assignedFleetVehicleId: true,
      assignedFleetPlate: true,
    },
  });
  if (!booking) return { error: 'A foglalás nem található.' };

  const payloadParsed = parseJson<Prisma.InputJsonValue | null>(
    'Payload',
    input.payloadJson,
  );
  if (payloadParsed.error) return { error: payloadParsed.error };

  const pricingParsed = parseJson<Record<string, unknown> | null>(
    'Pricing snapshot',
    input.pricingSnapshotJson,
  );
  if (pricingParsed.error) return { error: pricingParsed.error };

  const deliveryParsed = parseJson<Record<string, unknown> | null>(
    'Delivery details',
    input.deliveryDetailsJson,
  );
  if (deliveryParsed.error) return { error: deliveryParsed.error };

  const handoverCostsParsed = parseJson<Array<Record<string, unknown>> | null>(
    'Handover costs',
    input.handoverCostsJson,
  );
  if (handoverCostsParsed.error) return { error: handoverCostsParsed.error };

  const vehicleHandoversParsed = parseJson<Array<Record<string, unknown>> | null>(
    'Vehicle handovers',
    input.vehicleHandoversJson,
  );
  if (vehicleHandoversParsed.error) return { error: vehicleHandoversParsed.error };

  const bookingContractParsed = parseJson<Record<string, unknown> | null>(
    'Booking contract',
    input.bookingContractJson,
  );
  if (bookingContractParsed.error) return { error: bookingContractParsed.error };

  const rentalStart = parseDateOrNull(input.rentalStart);
  const rentalEnd = parseDateOrNull(input.rentalEnd);
  if (input.rentalStart && !rentalStart) return { error: 'A kezdő dátum érvénytelen.' };
  if (input.rentalEnd && !rentalEnd) return { error: 'A záró dátum érvénytelen.' };
  if (rentalStart && rentalEnd && rentalEnd < rentalStart) {
    return { error: 'A záró dátum nem lehet a kezdő dátum előtt.' };
  }

  const effectiveCarId = toOptionalString(input.carId) ?? booking.carid ?? null;
  const effectiveRentalStart = rentalStart ?? booking.rentalstart;
  const effectiveRentalEnd = rentalEnd ?? booking.rentalend;

  if (booking.rentalend && !effectiveRentalEnd) {
    return { error: 'A bérlés vége csak hosszabbítható, törölni nem lehet.' };
  }

  if (
    booking.rentalend &&
    effectiveRentalEnd &&
    effectiveRentalEnd.getTime() < booking.rentalend.getTime()
  ) {
    return { error: 'A bérlés vége csak hosszabbítható, rövidíteni nem lehet.' };
  }

  const isEndDateExtended = Boolean(
    booking.rentalend &&
      effectiveRentalEnd &&
      effectiveRentalEnd.getTime() > booking.rentalend.getTime(),
  );

  if (
    isEndDateExtended &&
    effectiveCarId &&
    effectiveRentalStart &&
    effectiveRentalEnd
  ) {
    const conflictingBooking = await findCarBookingConflict({
      bookingIdToExclude: bookingId,
      carId: effectiveCarId,
      rentalStart: effectiveRentalStart,
      rentalEnd: effectiveRentalEnd,
    });

    if (conflictingBooking) {
      const conflictLabel = conflictingBooking.humanId ?? conflictingBooking.id;
      const conflictStart = formatDateForConflictMessage(
        conflictingBooking.rentalstart,
      );
      const conflictEnd = formatDateForConflictMessage(
        conflictingBooking.rentalend,
      );
      return {
        error: `A bérlés vége csak addig hosszabbítható, amíg ugyanarra az autóra nincs másik foglalás (${conflictLabel}: ${conflictStart} - ${conflictEnd}).`,
      };
    }
  }

  const rentalDays = parseIntegerOrNull(input.rentalDays);
  if (input.rentalDays && input.rentalDays.trim() && rentalDays == null) {
    return { error: 'A bérelt napok száma érvénytelen.' };
  }

  const handoverCosts = (handoverCostsParsed.data ?? []).reduce<
    Array<{
      direction: HandoverDirectionValue;
      costType: HandoverCostTypeValue;
      amount: Prisma.Decimal;
    }>
  >((acc, row) => {
    const direction = toOptionalString(String(row.direction ?? '')) as HandoverDirectionValue;
    const costType = toOptionalString(String(row.costType ?? '')) as HandoverCostTypeValue;
    const amountRaw = toOptionalString(String(row.amount ?? ''));
    if (!direction || !DIRECTIONS.includes(direction)) return acc;
    if (!costType || !COST_TYPES.includes(costType)) return acc;
    if (!amountRaw) return acc;
    const numericAmount = Number(amountRaw);
    if (!Number.isFinite(numericAmount)) return acc;
    acc.push({
      direction,
      costType,
      amount: new Prisma.Decimal(numericAmount.toFixed(2)),
    });
    return acc;
  }, []);

  const vehicleHandovers = (vehicleHandoversParsed.data ?? []).reduce<
    Array<{
      fleetVehicleId: string;
      direction: HandoverDirectionValue;
      handoverAt: Date;
      handoverBy: string | null;
      mileage: number | null;
      notes: string | null;
      damages: string | null;
      damagesImages: string[];
    }>
  >((acc, row) => {
    const fleetVehicleId = toOptionalString(String(row.fleetVehicleId ?? ''));
    const direction = toOptionalString(String(row.direction ?? '')) as HandoverDirectionValue;
    const handoverAtRaw = toOptionalString(String(row.handoverAt ?? ''));
    if (!fleetVehicleId || !direction || !DIRECTIONS.includes(direction)) return acc;
    const parsedHandoverAt = handoverAtRaw ? new Date(handoverAtRaw) : new Date();
    if (Number.isNaN(parsedHandoverAt.getTime())) return acc;
    const mileageRaw = toOptionalString(String(row.mileage ?? ''));
    const mileage = mileageRaw ? Number.parseInt(mileageRaw, 10) : null;
    acc.push({
      fleetVehicleId,
      direction,
      handoverAt: parsedHandoverAt,
      handoverBy: toOptionalString(String(row.handoverBy ?? '')) ?? null,
      mileage: Number.isFinite(mileage ?? Number.NaN) ? mileage : null,
      notes: toOptionalString(String(row.notes ?? '')) ?? null,
      damages: toOptionalString(String(row.damages ?? '')) ?? null,
      damagesImages: Array.isArray(row.damagesImages)
        ? row.damagesImages
            .map((item) => toOptionalString(String(item ?? '')))
            .filter((item): item is string => Boolean(item))
        : [],
    });
    return acc;
  }, []);

  const pricingData = toRecordOrNull<BookingPricingSnapshotInput>(pricingParsed.data);
  const deliveryData = toRecordOrNull<BookingDeliveryDetailsInput>(deliveryParsed.data);
  const contractData = toRecordOrNull<BookingContractInput>(bookingContractParsed.data);
  const payloadForStatus = payloadParsed.data;
  const payloadForStorage = stripAssignedFleetFromPayload(payloadParsed.data);
  const payloadAssignedFleetVehicleId = getAssignedFleetVehicleIdFromPayload(
    payloadParsed.data,
  );
  const payloadAssignedFleetPlate = getAssignedFleetPlateFromPayload(
    payloadParsed.data,
  );
  const payloadHasAssignedFleet =
    Boolean(payloadAssignedFleetVehicleId) && Boolean(payloadAssignedFleetPlate);
  const effectiveAssignedFleetVehicleId =
    payloadHasAssignedFleet
      ? payloadAssignedFleetVehicleId
      : (booking.assignedFleetVehicleId ?? null);
  const effectiveAssignedFleetPlate =
    payloadHasAssignedFleet
      ? payloadAssignedFleetPlate
      : (booking.assignedFleetPlate ?? null);
  const statusFromInput = toOptionalString(input.status) ?? 'new';
  const effectiveStatus = hasAssignedFleetAssignment({
    assignedFleetVehicleId: effectiveAssignedFleetVehicleId,
    assignedFleetPlate: effectiveAssignedFleetPlate,
    payload: payloadForStatus,
  })
    ? RENT_STATUS_REGISTERED
    : statusFromInput;

  try {
    await db.$transaction(async (tx) => {
      await tx.rentRequests.update({
        where: { id: bookingId },
        data: {
          humanId: toOptionalString(input.humanId) ?? null,
          locale: toOptionalString(input.locale) ?? 'hu',
          carid: toOptionalString(input.carId) ?? null,
          assignedFleetVehicleId: effectiveAssignedFleetVehicleId,
          assignedFleetPlate: effectiveAssignedFleetPlate,
          quoteid: toOptionalString(input.quoteId) ?? null,
          contactname: toOptionalString(input.contactName) ?? '',
          contactemail: toOptionalString(input.contactEmail) ?? '',
          contactphone: toOptionalString(input.contactPhone) ?? null,
          rentalstart: rentalStart,
          rentalend: rentalEnd,
          rentaldays: rentalDays,
          status: effectiveStatus,
          updated: toOptionalString(input.updatedNote) ?? null,
          payload: payloadForStorage ?? Prisma.DbNull,
        },
      });

      if (!pricingData) {
        await tx.$executeRaw`
          DELETE FROM "BookingPricingSnapshots"
          WHERE "bookingId" = ${bookingId}::uuid
        `;
      } else {
        const rentalFee = toOptionalString(String(pricingData.rentalFee ?? '')) ?? null;
        const insurance = toOptionalString(String(pricingData.insurance ?? '')) ?? null;
        const deposit = toOptionalString(String(pricingData.deposit ?? '')) ?? null;
        const deliveryFee =
          toOptionalString(String(pricingData.deliveryFee ?? '')) ?? null;
        const extrasFee = toOptionalString(String(pricingData.extrasFee ?? '')) ?? null;
        const tip = toOptionalString(String(pricingData.tip ?? '')) ?? null;

        await tx.$executeRaw`
          INSERT INTO "BookingPricingSnapshots" (
            "bookingId",
            "rentalFee",
            "insurance",
            "deposit",
            "deliveryFee",
            "extrasFee",
            "tip",
            "updatedAt"
          )
          VALUES (
            ${bookingId}::uuid,
            ${rentalFee},
            ${insurance},
            ${deposit},
            ${deliveryFee},
            ${extrasFee},
            ${tip},
            timezone('utc'::text, now())
          )
          ON CONFLICT ("bookingId")
          DO UPDATE SET
            "rentalFee" = EXCLUDED."rentalFee",
            "insurance" = EXCLUDED."insurance",
            "deposit" = EXCLUDED."deposit",
            "deliveryFee" = EXCLUDED."deliveryFee",
            "extrasFee" = EXCLUDED."extrasFee",
            "tip" = EXCLUDED."tip",
            "updatedAt" = timezone('utc'::text, now())
        `;
      }

      if (!deliveryData) {
        await tx.$executeRaw`
          DELETE FROM "BookingDeliveryDetails"
          WHERE "bookingId" = ${bookingId}::uuid
        `;
      } else {
        const placeType = toOptionalString(String(deliveryData.placeType ?? '')) ?? null;
        const locationName =
          toOptionalString(String(deliveryData.locationName ?? '')) ?? null;
        const addressLine =
          toOptionalString(String(deliveryData.addressLine ?? '')) ?? null;
        const arrivalFlight =
          toOptionalString(String(deliveryData.arrivalFlight ?? '')) ?? null;
        const departureFlight =
          toOptionalString(String(deliveryData.departureFlight ?? '')) ?? null;
        const arrivalHour =
          toOptionalString(String(deliveryData.arrivalHour ?? '')) ?? null;
        const arrivalMinute =
          toOptionalString(String(deliveryData.arrivalMinute ?? '')) ?? null;
        const island = resolveDeliveryIsland({
          locationName,
          addressLine,
          arrivalFlight,
          departureFlight,
        });

        await tx.$executeRaw`
          INSERT INTO "BookingDeliveryDetails" (
            "bookingId",
            "placeType",
            "locationName",
            "addressLine",
            "island",
            "arrivalFlight",
            "departureFlight",
            "arrivalHour",
            "arrivalMinute",
            "updatedAt"
          )
          VALUES (
            ${bookingId}::uuid,
            ${placeType},
            ${locationName},
            ${addressLine},
            ${island},
            ${arrivalFlight},
            ${departureFlight},
            ${arrivalHour},
            ${arrivalMinute},
            timezone('utc'::text, now())
          )
          ON CONFLICT ("bookingId")
          DO UPDATE SET
            "placeType" = EXCLUDED."placeType",
            "locationName" = EXCLUDED."locationName",
            "addressLine" = EXCLUDED."addressLine",
            "island" = EXCLUDED."island",
            "arrivalFlight" = EXCLUDED."arrivalFlight",
            "departureFlight" = EXCLUDED."departureFlight",
            "arrivalHour" = EXCLUDED."arrivalHour",
            "arrivalMinute" = EXCLUDED."arrivalMinute",
            "updatedAt" = timezone('utc'::text, now())
        `;
      }

      await tx.$executeRaw`
        DELETE FROM "BookingHandoverCosts"
        WHERE "bookingId" = ${bookingId}::uuid
      `;
      if (handoverCosts.length > 0) {
        for (const row of handoverCosts) {
          await tx.$executeRaw`
            INSERT INTO "BookingHandoverCosts" (
              "bookingId",
              "direction",
              "costType",
              "amount",
              "updatedAt"
            )
            VALUES (
              ${bookingId}::uuid,
              CAST(${row.direction} AS "HandoverDirection"),
              CAST(${row.costType} AS "HandoverCostType"),
              ${row.amount},
              timezone('utc'::text, now())
            )
          `;
        }
      }

      await tx.vehicleHandover.deleteMany({ where: { bookingId } });
      if (vehicleHandovers.length > 0) {
        await tx.vehicleHandover.createMany({
          data: vehicleHandovers.map((row) => ({
            bookingId,
            fleetVehicleId: row.fleetVehicleId,
            direction: row.direction,
            handoverAt: row.handoverAt,
            handoverBy: row.handoverBy,
            mileage: row.mileage,
            notes: row.notes,
            damages: row.damages,
            damagesImages: row.damagesImages,
          })),
        });
      }

      if (!contractData) {
        await tx.bookingContract.deleteMany({ where: { bookingId } });
      } else {
        const signerName = toOptionalString(String(contractData.signerName ?? ''));
        const contractText = toOptionalString(String(contractData.contractText ?? ''));
        const signatureData = toOptionalString(String(contractData.signatureData ?? ''));

        if (!signerName || !contractText || !signatureData) {
          throw new Error(
            'A booking contract JSON esetén a signerName, contractText és signatureData kötelező.',
          );
        }

        const signedAtRaw = toOptionalString(String(contractData.signedAt ?? ''));
        const pdfSentAtRaw = toOptionalString(String(contractData.pdfSentAt ?? ''));
        const signedAt = signedAtRaw ? new Date(signedAtRaw) : new Date();
        const pdfSentAt = pdfSentAtRaw ? new Date(pdfSentAtRaw) : null;
        if (Number.isNaN(signedAt.getTime())) {
          throw new Error('A booking contract signedAt mezője érvénytelen.');
        }
        if (pdfSentAt && Number.isNaN(pdfSentAt.getTime())) {
          throw new Error('A booking contract pdfSentAt mezője érvénytelen.');
        }

        await tx.bookingContract.upsert({
          where: { bookingId },
          create: {
            bookingId,
            signerName,
            signerEmail: toOptionalString(String(contractData.signerEmail ?? '')) ?? null,
            contractVersion:
              toOptionalString(String(contractData.contractVersion ?? '')) ?? 'v1',
            contractText,
            signatureData,
            lessorSignatureData:
              toOptionalString(String(contractData.lessorSignatureData ?? '')) ?? null,
            signedAt,
            pdfSentAt,
          },
          update: {
            signerName,
            signerEmail: toOptionalString(String(contractData.signerEmail ?? '')) ?? null,
            contractVersion:
              toOptionalString(String(contractData.contractVersion ?? '')) ?? 'v1',
            contractText,
            signatureData,
            lessorSignatureData:
              toOptionalString(String(contractData.lessorSignatureData ?? '')) ?? null,
            signedAt,
            pdfSentAt,
          },
        });
      }
    });
  } catch (error) {
    console.error('updateBookingAdminAction', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'A foglalás mentése közben hiba történt.',
    };
  }

  revalidatePath('/');
  revalidatePath('/calendar');
  revalidatePath(`/${bookingId}`);
  revalidatePath(`/bookings/${bookingId}/edit`);
  revalidatePath(`/bookings/${bookingId}/carout`);
  revalidatePath(`/bookings/${bookingId}/carin`);
  revalidatePath('/analitycs');

  return { success: 'A foglalás teljes admin adatai mentve.' };
};
