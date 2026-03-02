import type { Booking } from '@/data-service/bookings';
import type { ContractData } from '@/lib/contract-template';
import { ADMIN_SIGNATURE } from '@/lib/constants';

import type { BookingDriver } from '@/data-service/bookings';

type VehicleSummary = {
  plate?: string | null;
};

const formatAddress = (address?: {
  country?: string;
  postalCode?: string;
  city?: string;
  street?: string;
  streetType?: string;
  doorNumber?: string;
}) => {
  if (!address) return '';
  const parts = [
    address.country,
    address.postalCode,
    address.city,
    address.street,
    address.streetType,
    address.doorNumber,
  ].filter(Boolean);
  return parts.join(' ');
};

const formatDriverName = (driver?: BookingDriver) => {
  if (!driver) return '';
  const parts = [
    driver.firstName_1,
    driver.firstName_2,
    driver.lastName_1,
    driver.lastName_2,
  ].filter(Boolean);
  return parts.join(' ');
};

const pickFirstValue = (...values: Array<string | null | undefined>) =>
  values.find((value) => value && value.trim().length > 0);

export const buildContractDataFromBooking = (
  booking: Booking,
  vehicle?: VehicleSummary | null,
): ContractData => {
  const recipient =
    booking.contactEmail ??
    booking.payload?.contact?.email ??
    booking.payload?.invoice?.email ??
    null;
  const driver = booking.payload?.driver?.[0];
  const driverName = formatDriverName(driver);
  const renterName =
    driverName ||
    booking.payload?.contact?.name ||
    booking.contactName ||
    undefined;
  const renterAddress = pickFirstValue(
    formatAddress(driver?.location),
    formatAddress(booking.payload?.invoice?.location),
    formatAddress(booking.payload?.delivery?.address),
  );
  const renterPhone = pickFirstValue(
    driver?.phoneNumber,
    booking.contactPhone ?? undefined,
    booking.payload?.invoice?.phoneNumber,
  );
  const rentalStart =
    booking.rentalStart ?? booking.payload?.rentalPeriod?.startDate;
  const rentalEnd =
    booking.rentalEnd ?? booking.payload?.rentalPeriod?.endDate;
  const plate =
    vehicle?.plate ?? booking.payload?.assignedFleetPlate ?? undefined;

  return {
    bookingId: booking.id,
    bookingCode: booking.humanId ?? booking.id,
    locale: booking.locale ?? booking.payload?.locale ?? null,
    renterName,
    renterNationality: driver?.location?.country ?? undefined,
    renterEmail: recipient,
    renterPhone,
    renterAddress,
    renterBirthPlace: driver?.placeOfBirth ?? undefined,
    renterBirthDate: driver?.dateOfBirth ?? undefined,
    renterIdCardNumber: driver?.document?.number ?? undefined,
    renterIdCardExpireDate: driver?.document?.validUntil ?? undefined,
    renterDrivingLicenseNumber:
      driver?.document?.drivingLicenceNumber ?? undefined,
    renterDrivingLicenseValidUntil:
      driver?.document?.drivingLicenceValidUntil ?? undefined,
    ownerCompanyName: ADMIN_SIGNATURE.company,
    carLabel: booking.carLabel ?? booking.carId ?? undefined,
    plate,
    rentalStart,
    rentalEnd,
    rentalDays: booking.rentalDays ?? undefined,
    rentalFee: booking.payload?.pricing?.rentalFee ?? undefined,
    deposit: booking.payload?.pricing?.deposit ?? undefined,
    insurance: booking.payload?.pricing?.insurance ?? undefined,
    pickupLocation: booking.payload?.delivery?.locationName ?? undefined,
    pickupAddress: formatAddress(booking.payload?.delivery?.address),
  };
};
