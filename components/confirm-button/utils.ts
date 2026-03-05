import type { BookingPayload } from '@/data-service/bookings';
import {
  formatAddress,
  formatAddressInputValue,
} from '@/lib/format/format-address';
import type { PricingBreakdown } from '@/hooks/use-rental-pricing';

import type { DeliveryFormState, PricingFormState } from './types';

export const buildPricingFormState = (
  pricing?: PricingBreakdown,
): PricingFormState => ({
  rentalFee: pricing?.rentalFee ?? '',
  insurance: pricing?.insurance ?? '',
  deposit: pricing?.deposit ?? '',
  deliveryFee: pricing?.deliveryFee ?? '',
  extrasFee: pricing?.extrasFee ?? '',
});

export const buildDeliveryFormState = (
  delivery?: BookingPayload['delivery'] | null,
  pricing?: PricingBreakdown,
): DeliveryFormState => ({
  placeType: delivery?.placeType ?? '',
  locationName: delivery?.locationName ?? pricing?.deliveryLocation ?? '',
  address: formatAddressInputValue(delivery?.address ?? null),
});

export const requiresDeliveryAddress = (placeType?: string | null) =>
  placeType === 'airport' || placeType === 'accommodation';

const hasDeliveryFeeValue = (value?: string | null) =>
  typeof value === 'string' && value.trim().length > 0;

const hasDeliveryLocation = (delivery?: BookingPayload['delivery'] | null) =>
  Boolean(delivery?.locationName && delivery.locationName.trim().length > 0);

const hasDeliveryAddress = (delivery?: BookingPayload['delivery'] | null) =>
  formatAddress(delivery?.address) !== '—';

export const isDeliveryDetailsRequired = (
  delivery: BookingPayload['delivery'] | null | undefined,
  deliveryFee?: string | null,
) => {
  const deliveryPlaceType = delivery?.placeType?.trim() ?? '';
  return (
    hasDeliveryFeeValue(deliveryFee) &&
    (!deliveryPlaceType ||
      (requiresDeliveryAddress(deliveryPlaceType) &&
        (!hasDeliveryLocation(delivery) || !hasDeliveryAddress(delivery))))
  );
};
