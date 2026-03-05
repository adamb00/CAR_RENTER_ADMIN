import { Booking } from '@/data-service/bookings';
import { formatAddress } from '@/lib/format/format-address';
import { booleanLabel } from '@/lib/format/format-boolean';
import { normalizePaymentMethod } from '@/lib/normalize-payment-method';
import { Detail } from '../ui/detail';
import Section from '../ui/section';
import { getRentDetails } from '@/lib/rent-details';

export default function RentContactDetails({ booking }: { booking: Booking }) {
  const { invoice, contactName, consents, same } = getRentDetails(booking);
  return (
    <Section title='Kapcsolat / Számlázás'>
      <Detail label='Kapcsolattartó' value={contactName} />
      <Detail label='Kapcsolattartó azonos?' value={booleanLabel(same)} />
      <Detail label='Számlázási név' value={invoice?.name} />
      <Detail label='Számlázási telefon' value={invoice?.phoneNumber} />
      <Detail label='Számlázási email' value={invoice?.email} />
      <Detail label='Számlázási cím' value={formatAddress(invoice?.location)} />
      <Detail label='Számlázás egyezik?' value={booleanLabel(invoice?.same)} />
      <Detail
        label='Fizetési mód'
        value={normalizePaymentMethod(consents?.paymentMethod)}
      />
    </Section>
  );
}
