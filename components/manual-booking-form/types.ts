export type FleetOption = {
  id: string;
  plate: string;
  carLabel: string;
  carId: string;
};

export type CarOption = {
  id: string;
  label: string;
};

export type ManualBookingFormProps = {
  fleetOptions: FleetOption[];
  carOptions: CarOption[];
  initialValues?: {
    fleetVehicleId?: string;
    rentalStart?: string;
    rentalEnd?: string;
    carId?: string;
  };
  lockFleetVehicle?: boolean;
};

export type TriState = '' | 'true' | 'false';

export type ChildDraft = {
  age: string;
  height: string;
};

export type DriverDraft = {
  firstName_1: string;
  firstName_2: string;
  lastName_1: string;
  lastName_2: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  placeOfBirth: string;
  locationCountry: string;
  locationPostalCode: string;
  locationCity: string;
  locationStreet: string;
  locationStreetType: string;
  locationDoorNumber: string;
  documentType: string;
  documentNumber: string;
  validFrom: string;
  validUntil: string;
  drivingLicenceNumber: string;
  drivingLicenceCategory: string;
  drivingLicenceValidFrom: string;
  drivingLicenceValidUntil: string;
  drivingLicenceIsOlderThan_3: TriState;
};

export type FormState = {
  locale: string;
  status: string;
  quoteIdentifier: string;
  rentalStart: string;
  rentalEnd: string;
  rentalDays: string;
  fleetVehicleId: string;
  carId: string;
  carLabel: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactSame: TriState;
  adults: string;
  extrasText: string;
  children: ChildDraft[];
  drivers: DriverDraft[];
  pricingRentalFee: string;
  pricingInsurance: string;
  pricingDeposit: string;
  pricingDeliveryFee: string;
  pricingDeliveryLocation: string;
  pricingExtrasFee: string;
  handoverTip: string;
  handoverFuelCost: string;
  handoverFerryCost: string;
  handoverCleaningCost: string;
  handoverCommission: string;
  selfServiceEventsJson: string;
  insuranceConsent: TriState;
  privacyConsent: TriState;
  termsConsent: TriState;
  paymentMethod: string;
  invoiceSame: TriState;
  invoiceName: string;
  invoicePhoneNumber: string;
  invoiceEmail: string;
  invoiceCountry: string;
  invoicePostalCode: string;
  invoiceCity: string;
  invoiceStreet: string;
  invoiceStreetType: string;
  invoiceDoorNumber: string;
  taxId: string;
  taxCompanyName: string;
  deliveryPlaceType: string;
  deliveryIsland: string;
  deliveryLocationName: string;
  arrivalFlight: string;
  arrivalHour: string;
  arrivalMinute: string;
  departureFlight: string;
  deliveryCountry: string;
  deliveryPostalCode: string;
  deliveryCity: string;
  deliveryStreet: string;
  deliveryStreetType: string;
  deliveryDoorNumber: string;
};

export type ValidationField =
  | 'contactName'
  | 'contactEmail'
  | 'contactPhone'
  | 'carId'
  | 'rentalStart'
  | 'rentalEnd';

export type ManualBookingFormMessage = {
  type: 'success' | 'error';
  text: string;
};
