'use client';

import { BookingCalendarModel } from '@/hooks/use-booking-calendar';
import type { FleetSortKey } from './types';

type BookingCalendarControlsProps = {
  calendar: BookingCalendarModel;
};

export function BookingCalendarControls({
  calendar,
}: BookingCalendarControlsProps) {
  return (
    <div className='flex flex-wrap items-center gap-3 rounded-xl border bg-card/40 p-4 shadow-sm'>
      <div className='flex items-center gap-2'>
        <label className='text-sm text-muted-foreground' htmlFor='range-start'>
          Kezdő dátum
        </label>
        <input
          id='range-start'
          type='date'
          value={calendar.rangeStart}
          onChange={(event) => calendar.setRangeStart(event.target.value)}
          className='rounded-md border px-3 py-2 text-sm'
        />
      </div>
      <div className='flex items-center gap-2'>
        <label className='text-sm text-muted-foreground' htmlFor='range-days'>
          Időtartam
        </label>
        <select
          id='range-days'
          value={calendar.rangeDays}
          onChange={(event) =>
            calendar.setRangeDays(Number(event.target.value))
          }
          className='rounded-md border px-3 py-2 text-sm'
        >
          <option value={7}>7 nap</option>
          <option value={10}>10 nap</option>
          <option value={14}>14 nap</option>
          <option value={21}>21 nap</option>
          <option value={30}>30 nap</option>
          <option value={45}>45 nap</option>
        </select>
      </div>
      <div className='flex items-center gap-2'>
        <label className='text-sm text-muted-foreground' htmlFor='fleet-sort'>
          Rendezés
        </label>
        <select
          id='fleet-sort'
          value={calendar.fleetSort}
          onChange={(event) =>
            calendar.setFleetSort(event.target.value as FleetSortKey)
          }
          className='rounded-md border px-3 py-2 text-sm'
        >
          <option value='car'>Autó típus</option>
          <option value='location'>Helyszín</option>
        </select>
      </div>
      {calendar.message && (
        <div className='text-sm font-medium text-emerald-600'>
          {calendar.message}
        </div>
      )}
    </div>
  );
}
