import React, { useState, useTransition } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { sendBookingFinalizationEmailAction } from '@/actions/sendBookingFinalizationEmailAction';
import { Booking } from '@/data-service/bookings';
import { StatusMessage } from './types';

type ConfirmButtonProps = {
  saved: boolean;
  deliveryDetailsRequired: boolean;
  deliverySaved: boolean;
  booking: Booking;
};

export default function ConfirmButton({
  saved,
  deliveryDetailsRequired,
  deliverySaved,
  booking,
}: ConfirmButtonProps) {
  const [signerName, setSignerName] = useState('');
  const [isSendingEmail, startSendTransition] = useTransition();
  const [emailStatus, setEmailStatus] = useState<StatusMessage | null>(null);

  const handleSendEmail = () => {
    setEmailStatus(null);
    startSendTransition(async () => {
      const result = await sendBookingFinalizationEmailAction({
        bookingId: booking.id,
        signerName,
      });
      if (result?.error) {
        setEmailStatus({ type: 'error', message: result.error });
        return;
      }
      setEmailStatus({
        type: 'success',
        message: result?.success ?? 'Foglalás véglegesítő e-mail elküldve.',
      });
    });
  };

  return (
    <div className='rounded-lg border bg-card p-4 space-y-3'>
      <div className='space-y-2'>
        <Input
          type='text'
          value={signerName}
          onChange={(event) => setSignerName(event.target.value)}
          label='Aláíró neve'
        />
      </div>
      <p className='text-sm text-muted-foreground'>
        Az alábbi gombbal elküldheted a foglalás véglegesítő e-mailt az
        ügyfélnek, benne az összes eddig ismert díjjal.
      </p>
      <Button
        type='button'
        className='w-full'
        disabled={
          isSendingEmail ||
          !signerName.trim() ||
          !saved ||
          (deliveryDetailsRequired && !deliverySaved)
        }
        onClick={handleSendEmail}
      >
        {isSendingEmail ? 'Küldés...' : 'Foglalás véglegesítő e-mail küldése'}
      </Button>
      {emailStatus && (
        <p
          className={`text-sm ${
            emailStatus.type === 'error'
              ? 'text-destructive'
              : 'text-emerald-600'
          }`}
        >
          {emailStatus.message}
        </p>
      )}
    </div>
  );
}
