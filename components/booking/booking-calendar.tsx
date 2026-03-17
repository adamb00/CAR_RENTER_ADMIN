'use client';

import { BookingCalendarControls } from './booking-calendar-controls';
import { BookingCalendarTimeline } from './booking-calendar-timeline';
import { BookingCalendarUnassignedSection } from './booking-calendar-unassigned-section';
import type { BookingCalendarProps } from './types';
import { useBookingCalendar } from '../../hooks/use-booking-calendar';

export function BookingCalendar(props: BookingCalendarProps) {
  const calendar = useBookingCalendar(props);

  return (
    <div className='min-w-0 max-w-screen space-y-6 overflow-hidden h-full'>
      <BookingCalendarControls calendar={calendar} />
      <BookingCalendarTimeline calendar={calendar} />
      <BookingCalendarUnassignedSection calendar={calendar} />
    </div>
  );
}
