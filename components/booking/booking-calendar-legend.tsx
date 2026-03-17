'use client';

import { AlertTriangle } from 'lucide-react';

import type { LocationLegendItem } from './types';
import { getBookingIslandColor } from './utils';

type BookingCalendarLegendProps = {
  items: LocationLegendItem[];
};

export function BookingCalendarLegend({
  items,
}: BookingCalendarLegendProps) {
  return (
    <div className='flex flex-col flex-wrap items-start gap-2 rounded-lg border border-slate-200 bg-muted/20 px-3 py-2 text-xs text-muted-foreground'>
      <div className='flex flex-wrap gap-4'>
        <span className='font-semibold text-foreground'>Jelmagyarázat:</span>
        <span className='inline-flex items-center gap-2'>
          <span className='h-3 w-3 rounded-sm border border-slate-400 bg-slate-300/60' />
          Szerviz nap
        </span>
        <span className='inline-flex items-center gap-2'>
          <span className='h-3 w-3 rounded-sm border border-emerald-300 bg-emerald-100/70' />
          Húzható cél
        </span>
        <span className='inline-flex items-center gap-2'>
          <span className='h-3 w-3 rounded-sm border border-rose-300 bg-rose-100/70' />
          Nem dobható cél
        </span>
        <span className='inline-flex items-center gap-2'>
          <span
            className='h-3 w-3 rounded-sm border border-black/15'
            style={{ backgroundColor: '#64748b' }}
          />
          Foglalás sáv (ismeretlen sziget)
        </span>
        <span className='inline-flex items-center gap-2'>
          <span
            className='h-3 w-3 rounded-sm border border-black/15'
            style={{ backgroundColor: getBookingIslandColor('Lanzarote') }}
          />
          Lanzarote foglalás
        </span>
        <span className='inline-flex items-center gap-2'>
          <span
            className='h-3 w-3 rounded-sm border border-black/15'
            style={{
              backgroundColor: getBookingIslandColor('Fuerteventura'),
            }}
          />
          Fuerteventura foglalás
        </span>
        <span className='inline-flex items-center gap-2'>
          <AlertTriangle className='h-3.5 w-3.5 text-rose-500' />
          Közelgő szerviz
        </span>
      </div>

      {items.length > 0 && (
        <div className='flex flex-wrap items-center gap-4'>
          <span className='font-semibold text-foreground'>Helyszínek:</span>
          {items.map((item) => (
            <span
              key={`${item.label}-${item.color.toLowerCase()}`}
              className='inline-flex items-center gap-2 bg-background/80 px-2 py-1 text-foreground'
            >
              <span
                className='h-2.5 w-2.5 rounded-full border border-black/10'
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
