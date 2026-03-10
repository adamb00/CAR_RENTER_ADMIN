'use client';
import { deleteBookingAction } from '@/actions/deleteBookingAction';
import { StatusMessage } from '@/components/confirm-button/types';
import { Button } from '@/components/ui/button';
import { Delete } from 'lucide-react';
import { useRouter } from 'next/navigation';

import React, { useState, useTransition } from 'react';

type DeleteBookingButtonProps = {
  bookingId: string;
  bookingCode: string;
};

export const DeleteBookingButton = ({
  bookingId,
  bookingCode,
}: DeleteBookingButtonProps) => {
  const router = useRouter();
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isDeleting, startTransition] = useTransition();
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDelete = () => {
    if (isDeleted) return;

    const confirmed = window.confirm(
      `Biztos ezt szeretnéd?\n\nA(z) ${bookingCode} foglalás törlése visszafordíthatatlan folyamat.`,
    );
    if (!confirmed) return;

    setStatus(null);
    startTransition(async () => {
      const result = await deleteBookingAction({ bookingId });
      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }
      setStatus({
        type: 'success',
        message: result?.success ?? 'Foglalás törölve.',
      });
      setIsDeleted(true);
      router.push('/calendar');
      router.refresh();
    });
  };

  return (
    <div className='flex flex-col items-end gap-1'>
      <Button
        type='button'
        variant='outline'
        className='gap-2 hover:bg-foreground hover:text-primary-foreground'
        disabled={isDeleting || isDeleted}
        onClick={handleDelete}
      >
        <Delete className='h-4 w-4' />
        {isDeleted ? 'Törölve' : 'Törlés'}
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
