'use client';

import { Button } from '@/components/ui/button';
import { sendQrCode } from './action';
import { useState, useTransition } from 'react';

export default function SendQR({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleOnClick = () => {
    setStatus(null);
    startTransition(async () => {
      const res = await sendQrCode(id);
      if (res?.error) {
        setStatus({ type: 'error', message: res.error });
        return;
      }

      setStatus({
        type: 'success',
        message: res?.success ?? 'A QR kód emailben elküldve.',
      });
    });
  };

  return (
    <div className='flex flex-col items-end gap-2'>
      <Button type='button' disabled={isPending} onClick={handleOnClick}>
        {isPending ? 'Qr kód küldése folyamatban' : 'QR kód küldése emailben'}
      </Button>
      {status && (
        <div
          className={
            status.type === 'success'
              ? 'rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900'
              : 'rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground'
          }
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
