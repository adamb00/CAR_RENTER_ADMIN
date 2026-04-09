export type BookingRequestOfferBase = {
  carId?: string | null;
  carName?: string | null;
  appliesToCars?: number | null;
  rentalFee?: string;
  originalRentalFee?: string;
  discountedRentalFee?: string;
  deposit?: string;
  insurance?: string;
  deliveryFee?: string;
  deliveryLocation?: string;
  extrasFee?: string;
  carImages?: string[] | null;
};

export type BookingRequestOffer = BookingRequestOfferBase & {
  bookingLink: string;
};

export type BookingRequestOfferInput = BookingRequestOfferBase & {
  bookingLink?: string | null;
};

export type SendBookingRequestEmailInput = {
  quoteId: string;
  email: string | null | undefined;
  name?: string | null;
  locale?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  adminName?: string | null;
  offers: BookingRequestOfferInput[];
};

export type SendBookingRequestEmailResolvedInput = Omit<
  SendBookingRequestEmailInput,
  'offers'
> & {
  offers: BookingRequestOffer[];
};

export type EmailCopy = {
  subject: string;
  greeting: (name?: string | null) => string;
  thankYou: string;
  instructions: string;
  paymentNote: string;
  cta: string;
  signature: string;
  successMessage?: string;
};

export type BookingRequestEmailProps = {
  copy: EmailCopy;
  input: SendBookingRequestEmailResolvedInput;
  logoSrc?: string;
};
