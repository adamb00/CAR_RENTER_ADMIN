'use client';

import { useState, useTransition } from 'react';
import { Mail } from 'lucide-react';

import { sendCurrentBookingContractEmailAction } from '@/actions/sendCurrentBookingContractEmailAction';
import { Button } from '@/components/ui/button';

type SendContractEmailButtonProps = {
  bookingId: string;
};

export function SendContractEmailButton({
  bookingId,
}: SendContractEmailButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleClick = () => {
    setStatus(null);
    startTransition(async () => {
      const result = await sendCurrentBookingContractEmailAction({ bookingId });
      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      setStatus({
        type: 'success',
        message: result?.success ?? 'A szerződés emailben elküldve.',
      });
    });
  };

  return (
    <div className='flex flex-col items-end gap-2'>
      <Button
        type='button'
        variant='outline'
        disabled={isPending}
        onClick={handleClick}
      >
        <Mail className='h-4 w-4' />
        {isPending ? 'Küldés...' : 'Szerződés küldése emailben'}
      </Button>
    </div>
  );
}
