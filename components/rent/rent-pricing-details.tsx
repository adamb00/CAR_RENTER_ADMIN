import { Booking } from '@/data-service/bookings';
import { ContactQuote } from '@/data-service/quotes';
import { useRentalPricing } from '@/hooks/use-rental-pricing';
import { formatPriceValue } from '@/lib/format/format-price';
import { Detail } from '../ui/detail';
import Section from '../ui/section';

type RentPricingDetailsProps = {
  booking: Booking;
  quote: ContactQuote | null;
};

export default function RentPricingDetails({
  booking,
  quote,
}: RentPricingDetailsProps) {
  const { pricingData, showPricingBreakdown } = useRentalPricing({
    booking,
    quote,
  });

  if (!showPricingBreakdown) return null;

  return (
    <Section title='Korábban ajánlott díjak' cols={4}>
      <Detail
        label='Foglalási díj'
        value={formatPriceValue(pricingData?.rentalFee)}
      />
      <Detail
        label='Biztosítás díja'
        value={formatPriceValue(pricingData?.insurance)}
      />
      {!pricingData?.insurance && (
        <Detail label='Kaució' value={formatPriceValue(pricingData?.deposit)} />
      )}
      <Detail
        label='Átvétel díja és helye'
        value={`${formatPriceValue(pricingData?.deliveryFee)} - ${pricingData?.deliveryLocation ?? ''}`}
      />
      <Detail
        label='Extrák díja'
        value={formatPriceValue(pricingData?.extrasFee)}
      />
    </Section>
  );
}
