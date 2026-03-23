import type { Booking, BookingDriver } from '@/data-service/bookings';
import type { ContractData } from '@/lib/contract-template';
import { ADMIN_SIGNATURE } from '@/lib/constants';

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

export const getPrimaryDriverFromBooking = (booking: Booking) =>
  booking.renter?.primaryDriver ?? booking.payload?.driver?.[0];

export const getContractRecipientFromBooking = (booking: Booking) =>
  pickFirstValue(
    getPrimaryDriverFromBooking(booking)?.email,
    booking.renter?.email ?? undefined,
    booking.contactEmail ?? undefined,
    booking.payload?.contact?.email,
    booking.payload?.invoice?.email,
  ) ?? null;

export const buildContractDataFromBooking = (
  booking: Booking,
  vehicle?: VehicleSummary | null,
): ContractData => {
  const pricing = booking.pricing;
  const delivery = booking.delivery;
  const recipient = getContractRecipientFromBooking(booking);
  const driver = getPrimaryDriverFromBooking(booking);
  const driverName = formatDriverName(driver);
  const renterName = pickFirstValue(
    driverName,
    booking.renter?.name ?? undefined,
    booking.payload?.contact?.name,
    booking.contactName,
  );
  const renterAddress = pickFirstValue(
    formatAddress(driver?.location),
    formatAddress(booking.payload?.invoice?.location),
    formatAddress(delivery?.address),
  );
  const renterPhone = pickFirstValue(
    driver?.phoneNumber,
    booking.renter?.phone ?? undefined,
    booking.contactPhone ?? undefined,
    booking.payload?.invoice?.phoneNumber,
  );
  const rentalStart =
    booking.rentalStart ?? booking.payload?.rentalPeriod?.startDate;
  const rentalEnd =
    booking.rentalEnd ?? booking.payload?.rentalPeriod?.endDate;
  const plate =
    vehicle?.plate ??
    booking.assignedFleetPlate ??
    booking.payload?.assignedFleetPlate ??
    undefined;

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
    rentalFee: pricing?.rentalFee ?? undefined,
    deposit: pricing?.deposit ?? undefined,
    insurance: pricing?.insurance ?? undefined,
    pickupLocation: delivery?.locationName ?? undefined,
    pickupAddress: formatAddress(delivery?.address),
  };
};
