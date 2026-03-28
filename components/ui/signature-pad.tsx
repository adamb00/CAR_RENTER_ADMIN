'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import SignatureCanvas, {
  type SignatureCanvasProps,
} from 'react-signature-canvas';

import { cn } from '@/lib/utils';

export type SignaturePadHandle = {
  clear: () => void;
  getDataUrl: () => string;
  isEmpty: () => boolean;
  setDataUrl: (dataUrl: string) => void;
};

type SignaturePadProps = {
  className?: string;
  onChange?: (dataUrl: string) => void;
};

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ className, onChange }, ref) => {
    const padRef = useRef<SignatureCanvas | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

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

    const setDataUrl = (dataUrl: string) => {
      const pad = padRef.current;
      if (!pad) return;

      pad.clear();

      if (!dataUrl) {
        onChange?.('');
        return;
      }

      pad.fromDataURL(dataUrl);
      onChange?.(dataUrl);
    };

    useEffect(() => {
      const pad = padRef.current;
      if (!pad || typeof ResizeObserver === 'undefined') return;

      const canvas = pad.getCanvas();

      const syncCanvasSize = () => {
        const nextWidth = canvas.offsetWidth;
        const nextHeight = canvas.offsetHeight;

        if (!nextWidth || !nextHeight) return;

        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const targetWidth = Math.floor(nextWidth * ratio);
        const targetHeight = Math.floor(nextHeight * ratio);

        if (
          canvas.width === targetWidth &&
          canvas.height === targetHeight
        ) {
          return;
        }

        const strokes = pad.toData();
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        canvas.getContext('2d')?.scale(ratio, ratio);
        pad.clear();

        if (strokes.length > 0) {
          pad.fromData(strokes);
        }
      };

      syncCanvasSize();

      const observer = new ResizeObserver(() => {
        syncCanvasSize();
      });

      observer.observe(canvas);
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, []);

    useImperativeHandle(
      ref,
      () => ({ clear, getDataUrl, isEmpty, setDataUrl }),
      [onChange],
    );

    const signatureOptions: SignatureCanvasProps = {
      penColor: '#0f172a',
      backgroundColor: '#ffffff',
      clearOnResize: false,
      onEnd: emitChange,
      canvasProps: {
        className: 'h-40 w-full touch-none',
        style: { touchAction: 'none' },
      },
    };

    return (
      <div
        ref={containerRef}
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
