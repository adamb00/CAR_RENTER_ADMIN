import { getBookings } from '@/data-service/bookings';
import { BookingsTable } from '@/components/bookings-table';

export const revalidate = 0;

export default async function RentPage() {
  const bookings = await getBookings();

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Foglalások</h1>
        <p className='text-muted-foreground'>
          A beérkezett foglalások áttekintése és részletei egy felületen.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground'>
          Még nincs beérkezett foglalás.
        </div>
      ) : (
        <BookingsTable data={bookings} />
      )}
    </div>
  );
}
