'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import SignatureCanvas, {
  type SignatureCanvasProps,
} from 'react-signature-canvas';

import { cn } from '@/lib/utils';

export type SignaturePadHandle = {
  clear: () => void;
  getDataUrl: () => string;
  isEmpty: () => boolean;
};

type SignaturePadProps = {
  className?: string;
  onChange?: (dataUrl: string) => void;
};

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ className, onChange }, ref) => {
    const padRef = useRef<SignatureCanvas | null>(null);

    const emitChange = () => {
      const pad = padRef.current;
      if (!pad) return;
      const dataUrl = pad.isEmpty() ? '' : pad.toDataURL('image/png');
      onChange?.(dataUrl);
    };

    const clear = () => {
      padRef.current?.clear();
      onChange?.('');
    };

    const getDataUrl = () => {
      const pad = padRef.current;
      if (!pad || pad.isEmpty()) return '';
      return pad.toDataURL('image/png');
    };

    const isEmpty = () => {
      const pad = padRef.current;
      return !pad || pad.isEmpty();
    };

    useImperativeHandle(ref, () => ({ clear, getDataUrl, isEmpty }), [
      onChange,
    ]);

    const signatureOptions: SignatureCanvasProps = {
      penColor: '#0f172a',
      backgroundColor: '#ffffff',
      clearOnResize: true,
      onEnd: emitChange,
      canvasProps: {
        className: 'h-40 w-full touch-none',
        style: { touchAction: 'none' },
      },
    };

    return (
      <div
        className={cn(
          'rounded-md border border-input bg-background',
          className,
        )}
      >
        <SignatureCanvas ref={padRef} {...signatureOptions} />
      </div>
    );
  },
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
