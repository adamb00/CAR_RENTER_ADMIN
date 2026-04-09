import { formatDatePeriod, rentalDays } from '@/lib/format/format-date';
import { normalizeConfirmationLocale } from '@/lib/format/format-locale';
import { formatPriceValue } from '@/lib/format/format-price';
import { resolveOfferCarsCount } from '@/lib/offer-car-count';
import { sanitizeName } from '@/lib/sanitize-name';
import { resolveOfferRentalPricing } from '@/lib/quote-offer-pricing';
import { EmailCopy, SendBookingRequestEmailResolvedInput } from '../types';
import { getStaticTexts } from './get-static-text';
import {
  buildEmailSignatureText,
  resolveEmailSignatureData,
} from '../email-signature';

export const buildTextBody = (
  copy: EmailCopy,
  input: SendBookingRequestEmailResolvedInput,
) => {
  const safeName = sanitizeName(input.name);
  const dateRange = formatDatePeriod(
    input.rentalStart,
    input.rentalEnd,
    input.locale ?? 'hu-HU',
  );
  const days = rentalDays(input.rentalStart, input.rentalEnd);
  const localeSafe = normalizeConfirmationLocale(input.locale);
  const staticText = getStaticTexts(localeSafe);
  const signatureData = resolveEmailSignatureData({
    signerName: input.adminName,
    locale: localeSafe,
    adminTitle: staticText.adminTitle,
    localizedSiteUrl: `https://zodiacsrentacar.com/${localeSafe}`,
    sloganLines: staticText.slogans,
  });

  const offers = Array.isArray(input.offers) ? input.offers : [];
  const offersText = offers
    .map((offer, index) => {
      const hasValue = (value?: string | null) =>
        Boolean(value && value.trim().length > 0);
      const pricing = resolveOfferRentalPricing(offer);
      const rentalFee = pricing.effectiveRentalFee
        ? formatPriceValue(pricing.effectiveRentalFee)
        : null;
      const originalRentalFee = pricing.originalRentalFee
        ? formatPriceValue(pricing.originalRentalFee)
        : null;
      const discountedRentalFee = pricing.discountedRentalFee
        ? formatPriceValue(pricing.discountedRentalFee)
        : null;
      const appliesToCars = resolveOfferCarsCount(offer.appliesToCars);
      const deposit = hasValue(offer.deposit) ? formatPriceValue(offer.deposit) : null;
      const insurancePrice = hasValue(offer.insurance)
        ? formatPriceValue(offer.insurance)
        : null;
      const deliveryFee = hasValue(offer.deliveryFee)
        ? formatPriceValue(offer.deliveryFee)
        : null;
      const deliveryLocation = offer.deliveryLocation?.trim();
      const extrasFee = hasValue(offer.extrasFee)
        ? formatPriceValue(offer.extrasFee)
        : null;
      const carLabel = offer.carName || offer.carId || '';
      const insuranceNote =
        insurancePrice && deposit ? staticText.insuranceNote : null;
      const lines = [
        `${staticText.offerLabel} ${index + 1}:`,
        carLabel || null,
        appliesToCars ? staticText.priceAppliesToCarsText(appliesToCars) : null,
        pricing.hasDiscount && originalRentalFee
          ? `${staticText.originalPriceLabel}: ${originalRentalFee}`
          : null,
        pricing.hasDiscount && discountedRentalFee
          ? `${staticText.discountedPriceLabel}: ${discountedRentalFee}`
          : rentalFee
            ? `${staticText.rentalFeeLabel}: ${rentalFee}`
            : null,
        deposit ? `${staticText.depositLabel}: ${deposit}` : null,
        insuranceNote ?? null,
        insurancePrice ? `${staticText.insuranceLabel}: ${insurancePrice}` : null,
        deliveryFee ? `${staticText.deliveryFeeLabel}: ${deliveryFee}` : null,
        deliveryLocation
          ? `${staticText.deliveryLocationLabel}: ${deliveryLocation}`
          : null,
        extrasFee ? `${staticText.extrasFeeLabel}: ${extrasFee}` : null,
        `${copy.cta}: ${offer.bookingLink}`,
      ].filter((line): line is string => Boolean(line));

      return `\n${lines.join('\n')}\n`;
    })
    .join('\n');

  return `${copy.greeting(safeName)}
  
  ${copy.thankYou}
  ${copy.instructions}
  ${copy.paymentNote}
  
  ${
    dateRange
      ? `${dateRange}${days ? ` (${days} ${staticText.daysSuffix})` : ''}`
      : ''
  }

  ${offersText}
  
  ${staticText.extrasNote}
  ${staticText.deliveryNote}
  
  ${copy.signature}

  ${buildEmailSignatureText(signatureData)}`;
};
