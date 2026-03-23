'use client';

import React, { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { createBookingContractAction } from '@/actions/createBookingContractAction';
import { sendBookingContractInviteAction } from '@/actions/sendBookingContractInviteAction';
import type { ContractTemplate } from '@/lib/contract-template';
import { formatDateTimeDetail } from '@/lib/format/format-date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SignaturePad, {
  type SignaturePadHandle,
} from '@/components/ui/signature-pad';

type ExistingContract = {
  signedAt: string;
  signerName: string;
  signatureData: string;
  lessorSignatureData?: string | null;
};

type ContractFormProps = {
  bookingId: string;
  template: ContractTemplate;
  contractText: string;
  renterName?: string | null;
  renterEmail?: string | null;
  existingContract?: ExistingContract | null;
  successRedirectPath?: string;
  downloadHref?: string | null;
};

export default function ContractForm({
  bookingId,
  template,
  contractText,
  renterName,
  renterEmail,
  existingContract,
  successRedirectPath,
  downloadHref,
}: ContractFormProps) {
  const router = useRouter();
  const signatureRef = useRef<SignaturePadHandle>(null);
  const lessorSignatureRef = useRef<SignaturePadHandle>(null);
  const [form, setForm] = useState({
    signerName: renterName ?? '',
    renterSignatureData: '',
    lessorSignatureData: '',
  });
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isInvitePending, startInviteTransition] = useTransition();

  const isSigned = useMemo(() => Boolean(existingContract), [existingContract]);

  if (isSigned && existingContract) {
    return (
      <div className='space-y-6'>
        <div className='rounded-xl border bg-card p-4 shadow-sm'>
          <h2 className='text-lg font-semibold'>{template.title}</h2>
          <p className='text-sm text-muted-foreground'>{template.intro}</p>
          <div className='mt-4 grid gap-2 text-sm'>
            {template.details.map((item) => (
              <div key={item.label} className='flex flex-col gap-1'>
                <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                  {item.label}
                </span>
                <span className='font-medium'>{item.value}</span>
              </div>
            ))}
          </div>
          <div className='mt-4 space-y-2 text-sm'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>
              Feltételek
            </p>
            <ul className='list-disc pl-5 space-y-1'>
              {template.terms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          </div>
          <p className='mt-4 text-sm text-muted-foreground'>{template.footer}</p>
        </div>

        <div className='rounded-xl border bg-card p-4 shadow-sm'>
          <div>
            <h2 className='text-lg font-semibold'>Szerződés aláírva</h2>
            <p className='text-sm text-muted-foreground'>
              Aláírta: {existingContract.signerName} •{' '}
              {formatDateTimeDetail(existingContract.signedAt)}
            </p>
          </div>
          <div className='mt-4 grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <span className='text-sm font-medium'>Bérlő aláírása</span>
              <div className='rounded-md border bg-background p-3 min-h-40 flex items-center justify-center'>
                <img
                  src={existingContract.signatureData}
                  alt='Bérlő aláírása'
                  className='max-h-32'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <span className='text-sm font-medium'>Bérbeadó aláírása</span>
              <div className='rounded-md border bg-background p-3 min-h-40 flex items-center justify-center'>
                {existingContract.lessorSignatureData ? (
                  <img
                    src={existingContract.lessorSignatureData}
                    alt='Bérbeadó aláírása'
                    className='max-h-32'
                  />
                ) : (
                  <span className='text-sm text-muted-foreground'>
                    Nincs megadva
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-xl border bg-card p-4 shadow-sm'>
          <p className='text-sm text-muted-foreground'>
            Mentett szerződés tartalma
          </p>
          {downloadHref ? (
            <div className='mt-3'>
              <Button asChild variant='outline' size='sm'>
                <a href={downloadHref}>PDF letöltése</a>
              </Button>
            </div>
          ) : null}
          <pre className='mt-2 whitespace-pre-wrap text-xs text-muted-foreground'>
            {contractText}
          </pre>
        </div>
      </div>
    );
  }

  const getCurrentLessorSignature = () =>
    form.lessorSignatureData || lessorSignatureRef.current?.getDataUrl() || '';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!form.signerName.trim()) {
      setStatus({
        type: 'error',
        message: 'Az aláíró neve kötelező.',
      });
      return;
    }

    const renterSignatureData =
      form.renterSignatureData || signatureRef.current?.getDataUrl() || '';
    if (!renterSignatureData || signatureRef.current?.isEmpty()) {
      setStatus({
        type: 'error',
        message: 'A bérlő aláírása kötelező.',
      });
      return;
    }

    const lessorSignatureData =
      getCurrentLessorSignature();
    if (!lessorSignatureData || lessorSignatureRef.current?.isEmpty()) {
      setStatus({
        type: 'error',
        message: 'A bérbeadó aláírása kötelező.',
      });
      return;
    }

    startTransition(async () => {
      const result = await createBookingContractAction({
        bookingId,
        signerName: form.signerName,
        renterSignatureData,
        lessorSignatureData,
      });

      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      setStatus({
        type: 'success',
        message: result?.success ?? 'Szerződés elküldve.',
      });
      router.replace(successRedirectPath ?? `/bookings/${bookingId}/carout`);
      router.refresh();
    });
  };

  const handleSendForSignature = () => {
    setStatus(null);

    if (!form.signerName.trim()) {
      setStatus({
        type: 'error',
        message: 'Az aláíró neve kötelező.',
      });
      return;
    }

    const lessorSignatureData = getCurrentLessorSignature();

    startInviteTransition(async () => {
      const result = await sendBookingContractInviteAction({
        bookingId,
        signerName: form.signerName,
        lessorSignatureData: lessorSignatureData || undefined,
      });

      if (result.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      setStatus({
        type: 'success',
        message: result.success ?? 'Az aláírási link elküldve.',
      });
      router.refresh();
    });
  };

  return (
    <div className='space-y-6'>
      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <h2 className='text-lg font-semibold'>{template.title}</h2>
        <p className='text-sm text-muted-foreground'>{template.intro}</p>
        <div className='mt-4 grid gap-2 text-sm'>
          {template.details.map((item) => (
            <div key={item.label} className='flex flex-col gap-1'>
              <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                {item.label}
              </span>
              <span className='font-medium'>{item.value}</span>
            </div>
          ))}
        </div>
        <div className='mt-4 space-y-2 text-sm'>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>
            Feltételek
          </p>
          <ul className='list-disc pl-5 space-y-1'>
            {template.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </div>
        <p className='mt-4 text-sm text-muted-foreground'>{template.footer}</p>
      </div>

      <form onSubmit={handleSubmit} className='grid gap-4 md:grid-cols-2'>
        <Input
          label='Aláíró neve'
          value={form.signerName}
          required
          onChange={(event) =>
            setForm((prev) => ({ ...prev, signerName: event.target.value }))
          }
        />
        <Input label='E-mail cím' value={renterEmail ?? '—'} disabled />
        <div className='md:col-span-2 grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Bérlő aláírása</span>
              <Button
                type='button'
                variant='secondary'
                onClick={() => {
                  signatureRef.current?.clear();
                  setForm((prev) => ({ ...prev, renterSignatureData: '' }));
                }}
              >
                Törlés
              </Button>
            </div>
            <SignaturePad
              ref={signatureRef}
              onChange={(dataUrl) =>
                setForm((prev) => ({ ...prev, renterSignatureData: dataUrl }))
              }
            />
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Bérbeadó aláírása</span>
              <Button
                type='button'
                variant='secondary'
                onClick={() => {
                  lessorSignatureRef.current?.clear();
                  setForm((prev) => ({ ...prev, lessorSignatureData: '' }));
                }}
              >
                Törlés
              </Button>
            </div>
            <SignaturePad
              ref={lessorSignatureRef}
              onChange={(dataUrl) =>
                setForm((prev) => ({ ...prev, lessorSignatureData: dataUrl }))
              }
            />
          </div>
        </div>

        <div className='md:col-span-2'>
          {status && (
            <p
              className={
                status.type === 'success'
                  ? 'text-sm text-emerald-700'
                  : 'text-sm text-destructive'
              }
            >
              {status.message}
            </p>
          )}
        </div>
        <div className='md:col-span-2 flex items-center justify-end'>
          <div className='flex flex-wrap justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              disabled={isPending || isInvitePending}
              onClick={handleSendForSignature}
            >
              {isInvitePending ? 'Küldés...' : 'Kiküldés aláírásra'}
            </Button>
            <Button type='submit' disabled={isPending || isInvitePending}>
              {isPending ? 'Küldés...' : 'Szerződés aláírása és küldése'}
            </Button>
          </div>
        </div>
      </form>
      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <p className='text-sm text-muted-foreground'>
          Mentett szerződés tartalma
        </p>
        {downloadHref ? (
          <div className='mt-3'>
            <Button asChild variant='outline' size='sm'>
              <a href={downloadHref}>PDF letöltése</a>
            </Button>
          </div>
        ) : null}
        <pre className='mt-2 whitespace-pre-wrap text-xs text-muted-foreground'>
          {contractText}
        </pre>
      </div>
    </div>
  );
}
