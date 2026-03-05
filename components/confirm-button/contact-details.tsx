import { Booking } from '@/data-service/bookings';
import { booleanLabel } from '@/lib/format/format-boolean';
import { getRentDetails } from '@/lib/rent-details';
import InfoGroup from '../ui/info-group';
import InfoRow from '../ui/info-row';

export default function ContactDetails({ booking }: { booking: Booking }) {
  const { contactName, contactEmail, contactPhone, same } =
    getRentDetails(booking);
  return (
    <InfoGroup title='Kapcsolattartó'>
      <InfoRow label='Név' value={contactName ?? '—'} />
      <InfoRow label='Email' value={contactEmail ?? '—'} />
      <InfoRow label='Telefon' value={contactPhone ?? '—'} />
      <InfoRow
        label='Kapcsolattartó egyezik a számlázással?'
        value={booleanLabel(same)}
      />
    </InfoGroup>
  );
}
