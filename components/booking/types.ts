import { BookingPricing } from '@/data-service/bookings';

export type HandoverDirectionValue = 'out' | 'in';
export type HandoverCostTypeValue =
  | 'tip'
  | 'fuel'
  | 'ferry'
  | 'cleaning'
  | 'commission';

export type BookingPricingSnapshotForm = {
  rentalFee: string;
  insurance: string;
  deposit: string;
  deliveryFee: string;
  extrasFee: string;
  tip: string;
};

export type BookingDeliveryDetailsForm = {
  placeType: string;
  locationName: string;
  addressLine: string;
  island: string;
  arrivalFlight: string;
  departureFlight: string;
  arrivalHour: string;
  arrivalMinute: string;
};

export type BookingDriverForm = {
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
  drivingLicenceNumber: string;
  drivingLicenceCategory: string;
};

export type BookingHandoverCostForm = {
  direction: HandoverDirectionValue;
  costType: HandoverCostTypeValue;
  amount: string;
};

export type VehicleHandoverForm = {
  fleetVehicleId: string;
  direction: HandoverDirectionValue;
  handoverAt: string;
  handoverBy: string;
  mileage: string;
  rangeKm: string;
  notes: string;
  damages: string;
  damagesImages: string;
};

export type BookingContractForm = {
  signerName: string;
  signerEmail: string;
  contractVersion: string;
  contractText: string;
  signatureData: string;
  lessorSignatureData: string;
  signedAt: string;
  pdfSentAt: string;
};

export type BookingAdminInitialData = {
  id: string;
  createdAt: string;
  updatedAt: string;
  humanId: string;
  locale: string;
  carId: string;
  quoteId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  rentalStart: string;
  rentalEnd: string;
  originalRentalEnd: string;
  maxExtendableRentalEnd: string;
  nextCarBookingCode: string;
  rentalDays: string;
  status: string;
  updatedNote: string;
  payloadJson: string;
  drivers: BookingDriverForm[];
  hasPricingSnapshot: boolean;
  pricingSnapshot: BookingPricingSnapshotForm;
  hasDeliveryDetails: boolean;
  deliveryDetails: BookingDeliveryDetailsForm;
  handoverCosts: BookingHandoverCostForm[];
  vehicleHandovers: VehicleHandoverForm[];
  hasBookingContract: boolean;
  bookingContract: BookingContractForm;
};

export type BookingAdminEditFormProps = {
  initial: BookingAdminInitialData;
};

export type BookingCalendarBooking = {
  id: string;
  humanId?: string | null;
  contactName: string;
  rentalStart?: string;
  rentalEnd?: string;
  arrivalHour?: string | null;
  arrivalMinute?: string | null;
  handoverOutAt?: string | null;
  handoverInAt?: string | null;
  status?: string | null;
  assignedFleetVehicleId?: string;
  carLabel?: string | null;
  deliveryLocation?: string | null;
  deliveryIsland?: string | null;
  pricing?: BookingPricing | null;
  arrival?: string;
};

export type BookingCalendarVehicle = {
  id: string;
  plate: string;
  status: string;
  carLabel: string;
  carId: string;
  location: string;
  notes?: string | null;
  odometer: number;
  serviceIntervalKm?: number | null;
  lastServiceMileage?: number | null;
};

export type BookingCalendarProps = {
  bookings: BookingCalendarBooking[];
  fleetVehicles: BookingCalendarVehicle[];
  carOutBookingIds: string[];
};

export type FleetSortKey = 'car' | 'location';

export type BookingCalendarDay = {
  date: Date;
  label: string;
  iso: string;
};

export type ContextMenuPoint = {
  x: number;
  y: number;
};

export type LocationLegendItem = {
  label: string;
  color: string;
};

export type DropState = 'allowed' | 'blocked' | null;

export type VisibleBooking = BookingCalendarBooking & {
  clampedStartMs: number;
  clampedEndMs: number;
  offsetDays: number;
  spanDays: number;
};

export type DragPayload = {
  bookingId: string;
  sourceVehicleId?: string;
};
