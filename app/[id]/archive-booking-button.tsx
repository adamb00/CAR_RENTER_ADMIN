'use client';

import { Archive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { archiveBookingAction } from '@/actions/archiveBookingAction';
import { Button } from '@/components/ui/button';

type StatusMessage = { type: 'success' | 'error'; message: string };

type ArchiveBookingButtonProps = {
  bookingId: string;
  bookingCode: string;
};

export const ArchiveBookingButton = ({
  bookingId,
  bookingCode,
}: ArchiveBookingButtonProps) => {
  const router = useRouter();
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isArchiving, startTransition] = useTransition();
  const [isArchived, setIsArchived] = useState(false);

  const handleArchive = () => {
    if (isArchived) return;

    const confirmed = window.confirm(
      `Biztos ezt szeretnéd?\n\nA(z) ${bookingCode} foglalás archiválás után nem jelenik meg a foglalások között és a statisztikában.`,
    );
    if (!confirmed) return;

    setStatus(null);
    startTransition(async () => {
      const result = await archiveBookingAction({ bookingId });
      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }
      setStatus({
        type: 'success',
        message: result?.success ?? 'Foglalás archiválva.',
      });
      setIsArchived(true);
      router.refresh();
    });
  };

  return (
    <div className='flex flex-col items-end gap-1'>
      <Button
        type='button'
        variant='outline'
        className='gap-2'
        disabled={isArchiving || isArchived}
        onClick={handleArchive}
      >
        <Archive className='h-4 w-4' />
        {isArchived ? 'Archiválva' : 'Archiválás'}
      </Button>
      {status && (
        <p
          className={`text-right text-xs ${
            status.type === 'error' ? 'text-destructive' : 'text-emerald-600'
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
};
