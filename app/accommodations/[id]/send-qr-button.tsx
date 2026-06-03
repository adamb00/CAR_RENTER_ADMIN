'use client';

import { Button } from '@/components/ui/button';
import { Download, Mail } from 'lucide-react';
import { downloadQrCode, sendQrCode } from './action';
import { useState, useTransition } from 'react';

export default function SendQR({ id }: { id: string }) {
  const [isSending, startSendTransition] = useTransition();
  const [isDownloading, startDownloadTransition] = useTransition();
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSendClick = () => {
    setStatus(null);
    startSendTransition(async () => {
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

  const handleDownloadClick = () => {
    setStatus(null);
    startDownloadTransition(async () => {
      const res = await downloadQrCode(id);
      if (res?.error) {
        setStatus({ type: 'error', message: res.error });
        return;
      }

      if (!res?.dataUrl || !res.fileName) {
        setStatus({
          type: 'error',
          message: 'Nem sikerült előkészíteni a QR kód letöltését.',
        });
        return;
      }

      const link = document.createElement('a');
      link.href = res.dataUrl;
      link.download = res.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setStatus({
        type: 'success',
        message: res.success ?? 'A QR kód letöltése elindult.',
      });
    });
  };

  return (
    <div className='flex flex-col items-end gap-2'>
      <div className='flex flex-wrap justify-end gap-2'>
        <Button type='button' disabled={isSending} onClick={handleSendClick}>
          <Mail className='h-4 w-4' />
          {isSending ? 'QR kód küldése...' : 'QR kód küldése emailben'}
        </Button>
        <Button
          type='button'
          variant='outline'
          disabled={isDownloading}
          onClick={handleDownloadClick}
        >
          <Download className='h-4 w-4' />
          {isDownloading ? 'Letöltés...' : 'QR kód letöltése'}
        </Button>
      </div>
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
