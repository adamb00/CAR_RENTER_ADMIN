import { Booking } from '@/data-service/bookings';
import { formatAddress } from '@/lib/format/format-address';
import { booleanLabel } from '@/lib/format/format-boolean';
import { getRentDetails } from '@/lib/rent-details';
import InfoGroup from '../ui/info-group';
import InfoRow from '../ui/info-row';

export default function InvoiceDetails({ booking }: { booking: Booking }) {
  const { invoice, tax } = getRentDetails(booking);
  return (
    <>
      <InfoGroup title='Számlázási adatok'>
        <InfoRow label='Név' value={invoice?.name ?? '—'} />
        <InfoRow label='Email' value={invoice?.email ?? '—'} />
        <InfoRow label='Telefon' value={invoice?.phoneNumber ?? '—'} />
        <InfoRow label='Cím' value={formatAddress(invoice?.location)} />
        <InfoRow
          label='Számlázás egyezik a kapcsolattartóval?'
          value={booleanLabel(invoice?.same)}
        />
      </InfoGroup>

      <InfoGroup title='Adó / Cég adatok'>
        <InfoRow label='Cégnév' value={tax?.companyName ?? '—'} />
        <InfoRow label='Adószám' value={tax?.id ?? '—'} />
      </InfoGroup>
    </>
  );
}
