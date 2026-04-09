import { Booking } from '@/data-service/bookings';
import { ContactQuote } from '@/data-service/quotes';

export type PricingBreakdown = {
  rentalFee?: string | null;
  originalRentalFee?: string | null;
  discountedRentalFee?: string | null;
  insurance?: string | null;
  deposit?: string | null;
  deliveryFee?: string | null;
  extrasFee?: string | null;
  deliveryLocation?: string | null;
};

export const hasPricingDetails = (pricing?: PricingBreakdown) =>
  Boolean(
    pricing &&
    [
      pricing.rentalFee,
      pricing.originalRentalFee,
      pricing.discountedRentalFee,
      pricing.insurance,
      pricing.deposit,
      pricing.deliveryFee,
      pricing.extrasFee,
    ].some((value) => typeof value === 'string' && value.trim().length > 0),
  );

export function useRentalPricing({
  booking,
  quote,
}: {
  booking: Booking;
  quote: ContactQuote | null;
}) {
  const savedPricing: PricingBreakdown | undefined =
    booking.pricing ?? undefined;
  const offerAcceptedIndex =
    quote?.offerAccepted != null ? +quote.offerAccepted : 0;
  const quotePricingRaw = Array.isArray(quote?.bookingRequestData)
    ? quote.bookingRequestData[offerAcceptedIndex]
    : undefined;
  const quotePricing: PricingBreakdown | undefined = Array.isArray(
    quotePricingRaw,
  )
    ? (quotePricingRaw[0] as PricingBreakdown | undefined)
    : (quotePricingRaw as PricingBreakdown | undefined);
  const pricingData: PricingBreakdown | undefined =
    savedPricing ?? quotePricing ?? undefined;
  const hasQuotePricing = !savedPricing && Boolean(quotePricing);

  const showPricingBreakdown = hasPricingDetails(pricingData);

  return { hasQuotePricing, pricingData, showPricingBreakdown };
}
