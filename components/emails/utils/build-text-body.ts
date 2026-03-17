import { formatDatePeriod, rentalDays } from '@/lib/format/format-date';
import { normalizeConfirmationLocale } from '@/lib/format/format-locale';
import { formatPriceValue } from '@/lib/format/format-price';
import { sanitizeName } from '@/lib/sanitize-name';
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
      const rentalFee = formatPriceValue(offer.rentalFee);
      const deposit = formatPriceValue(offer.deposit);
      const insurancePrice = formatPriceValue(offer.insurance);
      const deliveryFee = formatPriceValue(offer.deliveryFee);
      const deliveryLocation = offer.deliveryLocation?.trim();
      const extrasFee = formatPriceValue(offer.extrasFee);
      const carLabel = offer.carName || offer.carId || '';
      const insuranceNote =
        insurancePrice && deposit ? staticText.insuranceNote : null;
      return `\n${staticText.offerLabel} ${index + 1}:\n${
        carLabel ? `${carLabel}` : ''
      }\n${
        rentalFee ? `${staticText.rentalFeeLabel}: ${rentalFee}` : ''
      }\n${deposit ? `${staticText.depositLabel}: ${deposit}` : ''}\n${
        insurancePrice ? `${insuranceNote ?? ''}` : ''
      }\n${
        insurancePrice ? `${staticText.insuranceLabel}: ${insurancePrice}` : ''
      }\n${
        deliveryFee ? `${staticText.deliveryFeeLabel}: ${deliveryFee}` : ''
      }\n${
        deliveryLocation
          ? `${staticText.deliveryLocationLabel}: ${deliveryLocation}`
          : ''
      }\n${
        extrasFee ? `${staticText.extrasFeeLabel}: ${extrasFee}` : ''
      }\n${copy.cta}: ${offer.bookingLink}\n`;
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
