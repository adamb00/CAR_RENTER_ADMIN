'use client';

import { useState, useTransition } from 'react';

import { setBookingRegisteredAction } from '@/actions/setBookingRegisteredAction';
import { RENT_STATUS_REGISTERED } from '@/lib/constants';

type BookingRegistrationCheckboxProps = {
  bookingId: string;
  initialStatus?: string | null;
};

type StatusMessage = {
  type: 'success' | 'error';
  text: string;
};

export const BookingRegistrationCheckbox = ({
  bookingId,
  initialStatus,
}: BookingRegistrationCheckboxProps) => {
  const [checked, setChecked] = useState(
    initialStatus === RENT_STATUS_REGISTERED
  );
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nextValue = !checked;
    startTransition(async () => {
      setMessage(null);
      try {
        const result = await setBookingRegisteredAction({
          bookingId,
          registered: nextValue,
        });
        if (result.error) {
          setMessage({ type: 'error', text: result.error });
          return;
        }

        setChecked(result.status === RENT_STATUS_REGISTERED);
        setMessage(
          result.success ? { type: 'success', text: result.success } : null
        );
      } catch (error) {
        console.error('booking registration toggle', error);
        setMessage({
          type: 'error',
          text: 'Ismeretlen hiba történt a státusz módosítása közben.',
        });
      }
    });
  };

  return (
    <div className='rounded-xl border bg-card p-4 shadow-sm'>
      <label className='flex items-start gap-3 text-sm font-medium text-foreground'>
        <input
          type='checkbox'
          checked={checked}
          onChange={handleToggle}
          disabled={isPending}
          className='mt-1 h-4 w-4 rounded border border-input accent-emerald-600 disabled:cursor-not-allowed'
        />
        <div className='flex flex-col gap-1'>
          <span>Rögzítve a vállalati rendszerben</span>
          <span className='text-xs font-normal text-muted-foreground'>
            Pipáld ki, amikor a foglalást véglegesítetted és felvetted a belső
            rendszerbe. A jelölést törölve a státusz visszaáll &quot;Elfogadott&quot;
            értékre.
          </span>
          {message && (
            <span
              className={`text-xs ${
                message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </label>
    </div>
  );
};
