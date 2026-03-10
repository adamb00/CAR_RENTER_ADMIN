import { ArchiveBookingButton } from '@/app/[id]/archive-booking-button';
import { DeleteBookingButton } from '@/app/[id]/delete-booking-button';
import { SendConfirmButton } from '@/app/[id]/send-confirm-button';
import { SendRejectButton } from '@/app/[id]/send-reject-button';
import type { Booking } from '@/data-service/bookings';
import type { ContactQuote } from '@/data-service/quotes';

type FinalizeRentButtonsProps = {
  booking: Booking;
  quote: ContactQuote | null;
};

export default function FinalizeRentButtons({
  booking,
  quote,
}: FinalizeRentButtonsProps) {
  return (
    <div className='flex w-full flex-col gap-3 sm:max-w-sm sm:items-end'>
      <div className='flex gap-4'>
        <ArchiveBookingButton
          bookingCode={booking.humanId ?? booking.id}
          bookingId={booking.id}
        />
        <DeleteBookingButton
          bookingCode={booking.humanId ?? booking.id}
          bookingId={booking.id}
        />
      </div>
      <SendRejectButton
        bookingCode={booking.humanId ?? booking.id}
        bookingId={booking.id}
      />
      <SendConfirmButton booking={booking} quote={quote} />
    </div>
  );
}
