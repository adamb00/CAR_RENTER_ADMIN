import { Booking } from '@/data-service/bookings';
import { formatAddress } from '@/lib/format/format-address';
import { formatArrivalTime } from '@/lib/format/format-date';
import { formatPlaceType } from '@/lib/format/format-place';
import { getRentDetails } from '@/lib/rent-details';
import { Detail } from '../ui/detail';
import Section from '../ui/section';

export default function RentDeliveryDetails({ booking }: { booking: Booking }) {
  const { delivery } = getRentDetails(booking);
  return (
    <Section title='Átvétel'>
      <Detail
        label='Átvétel helye'
        value={formatPlaceType(delivery?.placeType)}
      />
      <Detail label='Helyszín neve' value={delivery?.locationName} />
      <Detail label='Érkező járat' value={delivery?.arrivalFlight} />
      <Detail
        label='Érkezés ideje'
        value={formatArrivalTime(
          delivery?.arrivalHour,
          delivery?.arrivalMinute,
        )}
      />
      <Detail label='Távozó járat' value={delivery?.departureFlight} />
      <Detail label='Cím' value={formatAddress(delivery?.address)} />
    </Section>
  );
}
