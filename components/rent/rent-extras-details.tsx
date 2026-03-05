import { Booking } from '@/data-service/bookings';
import { capitalizeSlug } from '@/lib/capitalize-slug';
import { getRentDetails } from '@/lib/rent-details';
import Section from '../ui/section';

export default function RentExtrasDetails({ booking }: { booking: Booking }) {
  const { extras } = getRentDetails(booking);
  return (
    <Section title='Extrák'>
      <div className='flex flex-col gap-2 rounded-lg border px-3 py-3'>
        <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          Extrák
        </span>
        {extras.length > 0 ? (
          <div className='flex flex-wrap gap-2'>
            {extras.map((item, idx) => (
              <span
                key={idx}
                className='rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground'
              >
                {capitalizeSlug(item)}
              </span>
            ))}
          </div>
        ) : (
          <span className='text-base font-medium text-foreground'>—</span>
        )}
      </div>
    </Section>
  );
}
