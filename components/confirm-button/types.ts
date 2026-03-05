export type PricingKeys =
  | 'rentalFee'
  | 'insurance'
  | 'deposit'
  | 'deliveryFee'
  | 'extrasFee';

export type PricingFormState = Record<PricingKeys, string>;

export type DeliveryFormState = {
  placeType: string;
  locationName: string;
  address: string;
};

export type StatusMessage = { type: 'success' | 'error'; message: string };
