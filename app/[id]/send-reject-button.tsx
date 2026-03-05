'use client';

import { CircleX } from 'lucide-react';
import { useState, useTransition } from 'react';

import { sendBookingRejectionEmailAction } from '@/actions/sendBookingRejectionEmailAction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { StatusMessage } from '@/components/confirm-button/types';

type SendRejectButtonProps = {
  bookingId: string;
  bookingCode: string;
};

export const SendRejectButton = ({
  bookingId,
  bookingCode,
}: SendRejectButtonProps) => {
  const [open, setOpen] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isSending, startTransition] = useTransition();

  const handleSend = () => {
    setStatus(null);
    startTransition(async () => {
      const result = await sendBookingRejectionEmailAction({
        bookingId,
        signerName,
      });
      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }
      setStatus({
        type: 'success',
        message: result?.success ?? 'Elutasítási e-mail elküldve.',
      });
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type='button' variant='destructive' className='gap-2'>
          <CircleX className='h-4 w-4' />
          Foglalás elutasítása
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-full sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>Foglalás elutasítása</SheetTitle>
          <SheetDescription>
            A rendszer e-mailt küld a bérlőnek arról, hogy a kiválasztott
            időpontra nincs elérhető autó.
          </SheetDescription>
        </SheetHeader>

        <div className='mt-6 space-y-4 text-sm'>
          <div className='rounded-lg border bg-card p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Foglalás
            </p>
            <p className='mt-2 text-sm font-medium text-foreground'>
              Azonosító: {bookingCode}
            </p>
          </div>

          <div className='rounded-lg border bg-card p-4 space-y-3'>
            <Input
              type='text'
              value={signerName}
              onChange={(event) => setSignerName(event.target.value)}
              label='Aláíró neve'
            />
            <p className='text-sm text-muted-foreground'>
              Az e-mail nyelve automatikusan a foglalás nyelve lesz.
            </p>
            <Button
              type='button'
              className='w-full'
              variant='destructive'
              disabled={isSending || !signerName.trim()}
              onClick={handleSend}
            >
              {isSending ? 'Küldés...' : 'Elutasítási e-mail küldése'}
            </Button>
            {status && (
              <p
                className={`text-sm ${
                  status.type === 'error'
                    ? 'text-destructive'
                    : 'text-emerald-600'
                }`}
              >
                {status.message}
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
