import { notFound } from 'next/navigation';

import FinalizeRentButtons from '@/components/rent/finalize-rent-buttons';
import RentBaseDetails from '@/components/rent/rent-base-details';
import RentContactDetails from '@/components/rent/rent-contact-details';
import RentDeliveryDetails from '@/components/rent/rent-delivery-details';
import RentDriversDetails from '@/components/rent/rent-drivers-details';
import RentExtrasDetails from '@/components/rent/rent-extras-details';
import RentPassangersDetails from '@/components/rent/rent-passangers-details';
import RentPricingDetails from '@/components/rent/rent-pricing-details';
import { getBookingById } from '@/data-service/bookings';
import { getQuoteById } from '@/data-service/quotes';
import Link from 'next/link';
import { ResidenceCardGallery } from '../quotes/[id]/residence-card-gallery';
import { getAllUser } from '@/data-service/user';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBookingById(id);
  const quote = await getQuoteById(booking?.quoteId || '');
  const users = await getAllUser();
  if (!booking) {
    notFound();
  }

  const hasExtra = booking.payload?.extras && booking.payload.extras.length > 0;
  const residentCardContent = booking.payload?.residentCard?.content?.trim();
  const residentCardType = booking.payload?.residentCard?.type?.trim();
  const residentCardImages = residentCardContent
    ? [
        residentCardContent.startsWith('data:') ||
        residentCardContent.startsWith('http://') ||
        residentCardContent.startsWith('https://')
          ? residentCardContent
          : `data:${residentCardType || 'image/png'};base64,${residentCardContent}`,
      ]
    : [];
  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Foglalás -{' '}
              {booking.payload?.residentCard ? 'REZIDENS' : 'STANDARD'} -
              {booking.payload?.cars && +booking.payload.cars > 1
                ? ` ${booking.payload.cars} AUTÓS`
                : 'EGY AUTÓS'}
            </h1>
            <p className='text-muted-foreground'>
              A foglalás részletes adatai és az esetleges ajánlatkérés
              kapcsolata.
            </p>
            <Link
              className='text-sm text-sky-700 hover:underline'
              href={`/bookings/${booking.id}/edit`}
            >
              Tovabb a naptárhoz
            </Link>
          </div>
          <FinalizeRentButtons booking={booking} quote={quote} users={users} />
        </div>
      </div>

      <div className='space-y-4'>
        <RentBaseDetails booking={booking} quote={quote} />

        <RentPricingDetails booking={booking} quote={quote} />

        <RentPassangersDetails booking={booking} />

        <RentDriversDetails booking={booking} />

        <RentContactDetails booking={booking} />

        <RentDeliveryDetails booking={booking} />
        <ResidenceCardGallery images={residentCardImages} />

        {hasExtra && <RentExtrasDetails booking={booking} />}
      </div>
    </div>
  );
}
