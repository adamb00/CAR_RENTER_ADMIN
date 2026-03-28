import { Booking } from '@/data-service/bookings';
import { getRentDetails } from '@/lib/rent-details';
import { Detail } from '../ui/detail';
import Section from '../ui/section';

export default function RentPassangersDetails({
  booking,
}: {
  booking: Booking;
}) {
  const { adults, children } = getRentDetails(booking);

  return (
    <Section title='Utasok'>
      <Detail label='Felnőttek' value={adults} />
      <div className='flex flex-col gap-2 rounded-lg border px-3 py-3'>
        <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          Gyerekek
        </span>
        {children.length > 0 ? (
          <ul className='space-y-1 text-base font-medium text-foreground'>
            {children.map((child, index) => (
              <li key={index} className='flex items-center gap-3'>
                <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground'>
                  {index + 1}
                </span>
                <span className='text-sm text-foreground'>
                  {child.age != null ? `${child.age} év` : 'Életkor: —'}
                  {child.height != null ? ` • ${child.height} cm` : ''}
                  {child.weight != null ? ` • ${child.weight} kg` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className='text-base font-medium text-foreground'>—</span>
        )}
      </div>
    </Section>
  );
}
