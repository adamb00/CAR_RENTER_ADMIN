import { Booking } from '@/data-service/bookings';
import { formatDate } from '@/lib/format/format-date';
import { formatExtras } from '@/lib/format/format-extras';
import { getRentDetails } from '@/lib/rent-details';
import InfoGroup from '../ui/info-group';
import InfoRow from '../ui/info-row';

export default function BaseDetails({ booking }: { booking: Booking }) {
  const {
    localeLabel,
    carLabel,
    rentalStart,
    adults,
    rentalEnd,
    extras,
    children,
  } = getRentDetails(booking);

  const childCount = Array.isArray(children) ? children.length : null;
  return (
    <InfoGroup title='Foglalás'>
      <InfoRow
        label='Foglalás azonosító'
        value={booking.humanId ?? booking.id}
      />
      <InfoRow label='Rendszer ID' value={booking.id} />
      <InfoRow label='Nyelv' value={localeLabel} />
      <InfoRow label='Autó' value={carLabel ?? '—'} />
      <InfoRow
        label='Időszak'
        value={`${formatDate(rentalStart, 'long')} → ${formatDate(rentalEnd, 'long')}`}
      />
      <InfoRow
        label='Létszám'
        value={`Felnőttek: ${adults ?? '—'} • Gyerekek: ${childCount ?? '—'}`}
      />
      <InfoRow label='Extrák' value={formatExtras(extras)} />
    </InfoGroup>
  );
}
