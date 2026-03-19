import type {
  ChildDraft,
  DriverDraft,
  FormState,
  ManualBookingFormProps,
  RenterPrimaryDriver,
  ValidationField,
} from './types';

export const createEmptyChild = (): ChildDraft => ({
  age: '',
  height: '',
});

export const createEmptyDriver = (): DriverDraft => ({
  firstName_1: '',
  firstName_2: '',
  lastName_1: '',
  lastName_2: '',
  phoneNumber: '',
  email: '',
  dateOfBirth: '',
  placeOfBirth: '',
  locationCountry: '',
  locationPostalCode: '',
  locationCity: '',
  locationStreet: '',
  locationStreetType: '',
  locationDoorNumber: '',
  documentType: '',
  documentNumber: '',
  validFrom: '',
  validUntil: '',
  drivingLicenceNumber: '',
  drivingLicenceCategory: '',
  drivingLicenceValidFrom: '',
  drivingLicenceValidUntil: '',
  drivingLicenceIsOlderThan_3: '',
});

export const buildInitialManualBookingForm = (
  initialValues?: ManualBookingFormProps['initialValues'],
): FormState => ({
  locale: 'hu',
  status: 'registered',
  renterId: '',
  quoteIdentifier: '',
  rentalStart: initialValues?.rentalStart ?? '',
  rentalEnd: initialValues?.rentalEnd ?? '',
  rentalDays: '',
  fleetVehicleId: initialValues?.fleetVehicleId ?? '',
  carId: initialValues?.carId ?? '',
  carLabel: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactSame: '',
  adults: '',
  extrasText: '',
  children: [createEmptyChild()],
  drivers: [createEmptyDriver()],
  pricingRentalFee: '',
  pricingInsurance: '',
  pricingDeposit: '',
  pricingDeliveryFee: '',
  pricingDeliveryLocation: '',
  pricingExtrasFee: '',
  handoverTip: '',
  handoverFuelCost: '',
  handoverFerryCost: '',
  handoverCleaningCost: '',
  handoverCommission: '',
  selfServiceEventsJson: '',
  insuranceConsent: '',
  privacyConsent: '',
  termsConsent: '',
  paymentMethod: '',
  invoiceSame: '',
  invoiceName: '',
  invoicePhoneNumber: '',
  invoiceEmail: '',
  invoiceCountry: '',
  invoicePostalCode: '',
  invoiceCity: '',
  invoiceStreet: '',
  invoiceStreetType: '',
  invoiceDoorNumber: '',
  taxId: '',
  taxCompanyName: '',
  deliveryPlaceType: '',
  deliveryIsland: '',
  deliveryLocationName: '',
  arrivalFlight: '',
  arrivalHour: '',
  arrivalMinute: '',
  departureFlight: '',
  deliveryCountry: '',
  deliveryPostalCode: '',
  deliveryCity: '',
  deliveryStreet: '',
  deliveryStreetType: '',
  deliveryDoorNumber: '',
});

export const splitExtras = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export const splitNameForDriver = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const parts = trimmed.split(/\s+/).filter((part) => part.length > 0);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? '', lastName: '' };
  }

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
};

export const buildNameFromDriver = (driver?: DriverDraft) =>
  [driver?.firstName_1?.trim(), driver?.lastName_1?.trim()]
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join(' ');

const toDraftString = (value?: string | null) => value?.trim() ?? '';

const toTriState = (
  value?: boolean | null,
): DriverDraft['drivingLicenceIsOlderThan_3'] => {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
};

export const mapRenterPrimaryDriverToDraft = (
  primaryDriver?: RenterPrimaryDriver | null,
): DriverDraft => ({
  ...createEmptyDriver(),
  firstName_1: toDraftString(primaryDriver?.firstName_1),
  firstName_2: toDraftString(primaryDriver?.firstName_2),
  lastName_1: toDraftString(primaryDriver?.lastName_1),
  lastName_2: toDraftString(primaryDriver?.lastName_2),
  phoneNumber: toDraftString(primaryDriver?.phoneNumber),
  email: toDraftString(primaryDriver?.email),
  dateOfBirth: toDraftString(primaryDriver?.dateOfBirth),
  placeOfBirth: toDraftString(primaryDriver?.placeOfBirth),
  locationCountry: toDraftString(primaryDriver?.location?.country),
  locationPostalCode: toDraftString(primaryDriver?.location?.postalCode),
  locationCity: toDraftString(primaryDriver?.location?.city),
  locationStreet: toDraftString(primaryDriver?.location?.street),
  locationStreetType: toDraftString(primaryDriver?.location?.streetType),
  locationDoorNumber: toDraftString(primaryDriver?.location?.doorNumber),
  documentType: toDraftString(primaryDriver?.document?.type),
  documentNumber: toDraftString(primaryDriver?.document?.number),
  validFrom: toDraftString(primaryDriver?.document?.validFrom),
  validUntil: toDraftString(primaryDriver?.document?.validUntil),
  drivingLicenceNumber: toDraftString(
    primaryDriver?.document?.drivingLicenceNumber,
  ),
  drivingLicenceCategory: toDraftString(
    primaryDriver?.document?.drivingLicenceCategory,
  ),
  drivingLicenceValidFrom: toDraftString(
    primaryDriver?.document?.drivingLicenceValidFrom,
  ),
  drivingLicenceValidUntil: toDraftString(
    primaryDriver?.document?.drivingLicenceValidUntil,
  ),
  drivingLicenceIsOlderThan_3: toTriState(
    primaryDriver?.document?.drivingLicenceIsOlderThan_3,
  ),
});

export const getValidationFieldFromError = (
  error: string,
): ValidationField | null => {
  const lower = error.toLowerCase();
  if (error.includes('név')) return 'contactName';
  if (lower.includes('e-mail')) return 'contactEmail';
  if (lower.includes('telefon')) return 'contactPhone';
  if (lower.includes('autó')) return 'carId';
  if (lower.includes('záró dátum')) return 'rentalEnd';
  if (lower.includes('dátum')) return 'rentalStart';
  return null;
};

export const buildManualBookingPayload = (form: FormState) => ({
  locale: form.locale,
  status: form.status,
  renterId: form.renterId || null,
  quoteIdentifier: form.quoteIdentifier,
  contactName: form.contactName,
  contactEmail: form.contactEmail,
  contactPhone: form.contactPhone,
  rentalStart: form.rentalStart,
  rentalEnd: form.rentalEnd,
  rentalDays: form.rentalDays,
  fleetVehicleId: form.fleetVehicleId || null,
  carId: form.carId,
  carLabel: form.carLabel,
  adults: form.adults,
  extras: splitExtras(form.extrasText),
  children: form.children,
  drivers: form.drivers.map((driver) => ({
    firstName_1: driver.firstName_1,
    firstName_2: driver.firstName_2,
    lastName_1: driver.lastName_1,
    lastName_2: driver.lastName_2,
    phoneNumber: driver.phoneNumber,
    email: driver.email,
    dateOfBirth: driver.dateOfBirth,
    placeOfBirth: driver.placeOfBirth,
    location: {
      country: driver.locationCountry,
      postalCode: driver.locationPostalCode,
      city: driver.locationCity,
      street: driver.locationStreet,
      streetType: driver.locationStreetType,
      doorNumber: driver.locationDoorNumber,
    },
    document: {
      type: driver.documentType,
      number: driver.documentNumber,
      validFrom: driver.validFrom,
      validUntil: driver.validUntil,
      drivingLicenceNumber: driver.drivingLicenceNumber,
      drivingLicenceCategory: driver.drivingLicenceCategory,
      drivingLicenceValidFrom: driver.drivingLicenceValidFrom,
      drivingLicenceValidUntil: driver.drivingLicenceValidUntil,
      drivingLicenceIsOlderThan_3: driver.drivingLicenceIsOlderThan_3,
    },
  })),
  contact: {
    same: form.contactSame,
  },
  invoice: {
    same: form.invoiceSame,
    name: form.invoiceName,
    phoneNumber: form.invoicePhoneNumber,
    email: form.invoiceEmail,
    location: {
      country: form.invoiceCountry,
      postalCode: form.invoicePostalCode,
      city: form.invoiceCity,
      street: form.invoiceStreet,
      streetType: form.invoiceStreetType,
      doorNumber: form.invoiceDoorNumber,
    },
  },
  delivery: {
    placeType: form.deliveryPlaceType,
    island: form.deliveryIsland,
    locationName: form.deliveryLocationName,
    arrivalFlight: form.arrivalFlight,
    departureFlight: form.departureFlight,
    arrivalHour: form.arrivalHour,
    arrivalMinute: form.arrivalMinute,
    address: {
      country: form.deliveryCountry,
      postalCode: form.deliveryPostalCode,
      city: form.deliveryCity,
      street: form.deliveryStreet,
      streetType: form.deliveryStreetType,
      doorNumber: form.deliveryDoorNumber,
    },
  },
  tax: {
    id: form.taxId,
    companyName: form.taxCompanyName,
  },
  consents: {
    privacy: form.privacyConsent,
    terms: form.termsConsent,
    insurance: form.insuranceConsent,
    paymentMethod: form.paymentMethod,
  },
  pricing: {
    rentalFee: form.pricingRentalFee,
    insurance: form.pricingInsurance,
    deposit: form.pricingDeposit,
    deliveryFee: form.pricingDeliveryFee,
    deliveryLocation: form.pricingDeliveryLocation,
    extrasFee: form.pricingExtrasFee,
  },
  handoverCosts: {
    tip: form.handoverTip,
    fuelCost: form.handoverFuelCost,
    ferryCost: form.handoverFerryCost,
    cleaningCost: form.handoverCleaningCost,
    commission: form.handoverCommission,
  },
  selfServiceEventsJson: form.selfServiceEventsJson,
});
