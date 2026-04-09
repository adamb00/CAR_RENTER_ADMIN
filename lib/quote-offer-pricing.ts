type OfferRentalPricingInput = {
  rentalFee?: string | null;
  originalRentalFee?: string | null;
  discountedRentalFee?: string | null;
};

const toTrimmedValue = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const resolveOfferRentalPricing = (offer: OfferRentalPricingInput) => {
  const discountedRentalFee = toTrimmedValue(offer.discountedRentalFee);
  const currentRentalFee = toTrimmedValue(offer.rentalFee);
  const originalRentalFee = toTrimmedValue(offer.originalRentalFee);

  if (!discountedRentalFee) {
    return {
      effectiveRentalFee: currentRentalFee,
      originalRentalFee: null,
      discountedRentalFee: null,
      hasDiscount: false,
    };
  }

  const originalCandidate = originalRentalFee ?? currentRentalFee;
  const normalizedOriginalRentalFee =
    originalCandidate && originalCandidate !== discountedRentalFee
      ? originalCandidate
      : null;

  return {
    effectiveRentalFee: discountedRentalFee,
    originalRentalFee: normalizedOriginalRentalFee,
    discountedRentalFee,
    hasDiscount: Boolean(normalizedOriginalRentalFee),
  };
};

export const normalizeOfferRentalPricing = <
  T extends OfferRentalPricingInput,
>(
  offer: T,
) => {
  const pricing = resolveOfferRentalPricing(offer);

  return {
    ...offer,
    rentalFee: pricing.effectiveRentalFee ?? undefined,
    originalRentalFee: pricing.originalRentalFee ?? undefined,
    discountedRentalFee: pricing.discountedRentalFee ?? undefined,
  };
};
