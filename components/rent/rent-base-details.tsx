import { Booking } from '@/data-service/bookings';
import { Detail } from '../ui/detail';
import Section from '../ui/section';
import { getRentDetails } from '@/lib/rent-details';
import { getStatusMeta } from '@/lib/status';
import { booleanLabel } from '@/lib/format/format-boolean';
import Link from 'next/link';
import { formatDate } from '@/lib/format/format-date';
import { ContactQuote } from '@/data-service/quotes';

type RentBaseDetailsProps = {
  booking: Booking;
  quote: ContactQuote | null;
};

export default function RentBaseDetails({
  booking,
  quote,
}: RentBaseDetailsProps) {
  const quoteHumanId = quote?.humanId || quote?.id;

  const { contactEmail, contactName, localeLabel, rentalEnd, rentalStart } =
    getRentDetails(booking);
  return (
    <Section title='Foglalási adatok'>
      <Detail
        label='Foglalás azonosító'
        value={booking.humanId ?? booking.id}
      />
      <Detail label='Név' value={contactName} />
      <Detail label='Email' value={contactEmail} />
      <Detail label='Telefon' value={booking.contactPhone} />
      <Detail label='Nyelv' value={localeLabel} />
      <Detail
        label='Állapot'
        value={(() => {
          const meta = getStatusMeta(booking.status);
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${meta.badge}`}
            >
              {meta.label}
            </span>
          );
        })()}
      />
      <Detail
        label='Biztosítás'
        value={booleanLabel(booking.payload?.consents?.insurance)}
      />
      <Detail
        label='Autó'
        value={booking.carLabel ?? booking.carId ?? booking.payload?.carId}
      />
      <Detail
        label='Kapcsolt ajánlat'
        value={
          quoteHumanId ? (
            <Link
              href={`/quotes/${booking.quoteId}`}
              className='text-primary underline-offset-4 hover:underline'
            >
              {quoteHumanId}
            </Link>
          ) : (
            '—'
          )
        }
      />
      <div className='grid gap-3 md:grid-cols-3'>
        <Detail label='Kezdés' value={formatDate(rentalStart, 'short')} />
        <Detail label='Vége' value={formatDate(rentalEnd, 'short')} />
        <Detail label='Bérelt napok száma' value={booking.rentalDays ?? '—'} />
      </div>
      <div className='grid gap-3 md:grid-cols-2'>
        <Detail
          label='Beérkezett'
          value={formatDate(booking.createdAt, 'short')}
        />
        <Detail
          label='Frissítve'
          value={formatDate(booking.updatedAt, 'short')}
        />
      </div>
      <div>
        <Detail
          label='Autó'
          value={
            booking.carLabel ?? booking.carId ?? booking.payload?.carId ?? '—'
          }
        />
      </div>
    </Section>
  );
}
