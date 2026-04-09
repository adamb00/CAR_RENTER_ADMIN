'use client';

import { FileText } from 'lucide-react';

import BaseDetails from '@/components/confirm-button/base-details';
import ConfirmButton from '@/components/confirm-button/confirm-button';
import ContactDetails from '@/components/confirm-button/contact-details';
import DeliveryDetails from '@/components/confirm-button/delivery-details';
import InvoiceDetails from '@/components/confirm-button/invoice-details';
import PriceDetails from '@/components/confirm-button/price-details';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Booking } from '@/data-service/bookings';
import type { ContactQuote } from '@/data-service/quotes';
import { useSendConfirmState } from '@/hooks/use-send-confirm-state';
import type { UserOptionSource } from '@/lib/user-options';

type SendConfirmButtonProps = {
  users: UserOptionSource[];
  booking: Booking;
  quote: ContactQuote | null;
};

export const SendConfirmButton = ({
  users,
  booking,
  quote,
}: SendConfirmButtonProps) => {
  const {
    open,
    setOpen,
    pricing,
    pricingValues,
    setPricingValues,
    deliveryValues,
    setDeliveryValues,
    deliveryDetailsRequired,
    deliverySaved,
    setDeliverySaved,
    saved,
    setSaved,
  } = useSendConfirmState({
    booking,
    quote,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='gap-2 bg-green-500 text-white'
        >
          <FileText className='h-4 w-4' />
          Foglalás véglegesítő
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-full sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>Foglalás véglegesítő</SheetTitle>
          <SheetDescription>
            A foglaláshoz kapcsolódó legfontosabb adatok összegyűjtve a
            véglegesítéshez.
          </SheetDescription>
        </SheetHeader>

        <div className='mt-6 flex flex-1 flex-col gap-4 overflow-y-auto pb-6 text-sm'>
          <BaseDetails booking={booking} />

          <PriceDetails
            pricingValues={pricingValues}
            setPricingValues={setPricingValues}
            setSaved={setSaved}
            bookingId={booking.id}
          />

          <ContactDetails booking={booking} />

          <InvoiceDetails booking={booking} />

          <DeliveryDetails
            booking={booking}
            deliveryValues={deliveryValues}
            setDeliveryValues={setDeliveryValues}
            setDeliverySaved={setDeliverySaved}
            deliveryDetailsRequired={deliveryDetailsRequired}
            pricing={pricing}
          />

          <ConfirmButton
            booking={booking}
            saved={saved}
            deliveryDetailsRequired={deliveryDetailsRequired}
            deliverySaved={deliverySaved}
            users={users}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
