'use server';

import { db } from '@/lib/db';
import { getNextHumanId } from '@/lib/human-id';
import {
  registerNewRentSchema,
  type RegisterNewRentInput,
} from '@/schemas/register-new-rent-schema';

const calculateRentalDays = (start: Date, end: Date) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
  return Math.max(diff, 1);
};

const parseDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return new Date(`${trimmed}T00:00:00.000Z`);
};

export async function submitRegisterNewRentAction(input: RegisterNewRentInput) {
  const parsed = registerNewRentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? 'Invalid form data.',
    };
  }

  const data = parsed.data;
  const accommodation = await db.accommodation.findUnique({
    where: { id: data.accommodationId },
    select: { id: true, name: true, address: true, island: true, email: true },
  });

  if (!accommodation) {
    return {
      ok: false as const,
      message: 'Accommodation not found. Please scan a valid QR code.',
    };
  }

  const rentalStart = parseDateInput(data.rentalStart);
  const rentalEnd = parseDateInput(data.rentalEnd);
  const arrivalHour = data.arrivalHour?.trim() || null;
  const arrivalMinute = data.arrivalMinute?.trim() || null;
  const selectedCarId = data.selectedCarId.trim() || null;
  const selectedCar = selectedCarId
    ? await db.car.findUnique({
        where: { id: selectedCarId },
        select: { id: true, manufacturer: true, model: true },
      })
    : null;

  if (selectedCarId && !selectedCar) {
    return {
      ok: false as const,
      message: 'Selected car was not found.',
    };
  }

  const rentalDays =
    rentalStart && rentalEnd ? calculateRentalDays(rentalStart, rentalEnd) : null;
  const humanId = await getNextHumanId('RentRequests');

  const booking = await db.rentRequests.create({
    data: {
      locale: data.locale,
      status: 'new',
      contactname: data.name,
      contactemail: data.email.trim(),
      contactphone: data.phone.trim() || null,
      carid: selectedCar?.id ?? null,
      rentalstart: rentalStart,
      rentalend: rentalEnd,
      rentaldays: rentalDays ?? undefined,
      humanId: humanId ?? undefined,
      accommodationId: accommodation.id,
      payload: {
        source: 'register-new-rent',
        preferredChannel: data.preferredChannel,
        paymentMethod: data.paymentMethod || '',
        consents: {
          paymentMethod: data.paymentMethod || '',
          insurance: data.wantsInsurance,
        },
        selectedCar: selectedCar
          ? {
              id: selectedCar.id,
              label: `${selectedCar.manufacturer} ${selectedCar.model}`,
            }
          : null,
        cars: data.cars,
        partySize: data.partySize ?? '',
        children: data.children ?? '',
        notes: data.notes ?? '',
        primaryDriver: {
          name: data.driverName,
          phoneNumber: data.driverPhone,
          email: data.driverEmail,
          dateOfBirth: data.driverBirthDate,
          location: {
            postalCode: data.driverPostalCode,
            city: data.driverCity,
            country: data.driverCountry,
            street: data.driverStreet,
            doorNumber: data.driverHouseNumber,
          },
          document: {
            drivingLicenceNumber: data.driverLicenseNumber,
            drivingLicenceCategory: data.driverLicenseCategory,
            drivingLicenceValidUntil: data.driverLicenseExpiryDate,
            drivingLicenceIsOlderThan_3: data.driverLicenseOlderThan3Years,
          },
        },
        driver: [
          {
            firstName_1: data.driverName,
            phoneNumber: data.driverPhone,
            email: data.driverEmail,
            dateOfBirth: data.driverBirthDate,
            location: {
              postalCode: data.driverPostalCode,
              city: data.driverCity,
              country: data.driverCountry,
              street: data.driverStreet,
              doorNumber: data.driverHouseNumber,
            },
            document: {
              drivingLicenceNumber: data.driverLicenseNumber,
              drivingLicenceCategory: data.driverLicenseCategory,
              drivingLicenceValidUntil: data.driverLicenseExpiryDate,
              drivingLicenceIsOlderThan_3: data.driverLicenseOlderThan3Years,
            },
          },
        ],
        invoice: {
          same: data.billingSameAsPrimaryDriver,
          name: data.billingName,
          taxNumber: data.billingTaxNumber ?? '',
          companyName: data.billingCompanyName ?? '',
          location: {
            postalCode: data.billingPostalCode,
            city: data.billingCity,
            country: data.billingCountry,
            street: data.billingStreet,
            doorNumber: data.billingHouseNumber,
          },
        },
        accommodation: {
          id: accommodation.id,
          name: accommodation.name,
          address: accommodation.address,
          island: accommodation.island,
          email: accommodation.email,
        },
      },
      bookingDeliveryDetails: {
        create: {
          placeType: data.handoverPlaceType || null,
          locationName: data.handoverLocationName || null,
          island: accommodation.island,
          arrivalFlight: data.arrivalFlight || null,
          departureFlight: data.departureFlight || null,
          arrivalHour,
          arrivalMinute,
          same: false,
        },
      },
    },
    select: {
      id: true,
      humanId: true,
    },
  });

  return {
    ok: true as const,
    message: 'Rental request submitted successfully.',
    bookingId: booking.id,
    humanId: booking.humanId,
  };
}
