'use client';

import { assignFleetVehicleToBookingAction } from '@/actions/assignFleetVehicleToBookingAction';
import { intervalsOverlap, type BookingInterval } from '@/lib/booking-interval';
import { DAY_MS } from '@/lib/constants';
import {
  getFleetServiceWindowRangeFromNotes,
  isFleetBlockedByServiceWindow,
} from '@/lib/fleet-service-window';
import { formatDate } from '@/lib/format/format-date';
import { useRouter } from 'next/navigation';
import type { CSSProperties, DragEvent, MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import type {
  BookingCalendarBooking,
  BookingCalendarProps,
  DragPayload,
  DropState,
  FleetSortKey,
  VisibleBooking,
} from '../components/booking/types';
import {
  compareStrings,
  getBookingInterval,
  getLocationColor,
  getLocationLabel,
  startOfUtcDay,
  toDate,
  toIsoDate,
} from '../components/booking/utils';

const FIRST_COLUMN_WIDTH = 350;
const MIN_DAY_COLUMN_WIDTH = 150;
const DEFAULT_DAY_COLUMN_WIDTH = 100;
const DEFAULT_RANGE_DAYS = 14;

const ROW_STYLE: CSSProperties = {
  height: 56,
  minHeight: 56,
  maxHeight: 56,
};

const BOOKING_CHIP_STYLE_BASE: CSSProperties = {
  height: 48,
  minHeight: 48,
  maxHeight: 48,
};

const clampBookingToRange = (
  booking: BookingCalendarBooking,
  interval: BookingInterval,
  rangeStartMs: number,
  rangeEndExclusiveMs: number,
): VisibleBooking | null => {
  const bookingStartMs = interval.start.getTime();
  const bookingEndMs = interval.end.getTime();
  if (bookingEndMs <= rangeStartMs || bookingStartMs >= rangeEndExclusiveMs) {
    return null;
  }

  const clampedStartMs = Math.max(bookingStartMs, rangeStartMs);
  const clampedEndMs = Math.min(bookingEndMs, rangeEndExclusiveMs);
  if (clampedEndMs <= clampedStartMs) return null;

  const offsetDays = (clampedStartMs - rangeStartMs) / DAY_MS;
  const spanDays = (clampedEndMs - clampedStartMs) / DAY_MS;

  return {
    ...booking,
    clampedStartMs,
    clampedEndMs,
    offsetDays,
    spanDays,
  };
};

// const adjustRangeStartForBookingEnds = (
//   requestedStartIso: string,
//   bookings: BookingCalendarBooking[],
// ) => {
//   const requestedStartDate = toDate(requestedStartIso);
//   if (!requestedStartDate) return requestedStartIso;
//
//   const bookingEndDates = new Set(
//     bookings
//       .map((booking) => booking.rentalEnd?.trim())
//       .filter((value): value is string => Boolean(value)),
//   );
//
//   const adjusted = new Date(requestedStartDate);
//   let guard = 0;
//   while (guard < 366 && bookingEndDates.has(toIsoDate(adjusted))) {
//     adjusted.setUTCDate(adjusted.getUTCDate() - 1);
//     guard += 1;
//   }
//
//   return toIsoDate(adjusted);
// };

const getTodayIso = () => new Date().toISOString().slice(0, 10);

export function useBookingCalendar({
  bookings,
  fleetVehicles,
  carOutBookingIds,
}: BookingCalendarProps) {
  const router = useRouter();
  const [rangeStart, setRangeStart] = useState(getTodayIso);
  const [rangeDays, setRangeDays] = useState(DEFAULT_RANGE_DAYS);
  const [fleetSort, setFleetSort] = useState<FleetSortKey>('car');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const [hoverVehicleId, setHoverVehicleId] = useState<string | null>(null);
  const [contextMenuBookingId, setContextMenuBookingId] = useState<
    string | null
  >(null);
  const [contextMenuPoint, setContextMenuPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [rowContextMenuVehicleId, setRowContextMenuVehicleId] = useState<
    string | null
  >(null);
  const [rowContextMenuPoint, setRowContextMenuPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [rowContextMenuDateIso, setRowContextMenuDateIso] = useState<
    string | null
  >(null);
  const timelineViewportRef = useRef<HTMLDivElement | null>(null);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(0);

  // useEffect(() => {
  //   const adjustedStart = adjustRangeStartForBookingEnds(rangeStart, bookings);
  //   if (adjustedStart !== rangeStart) {
  //     setRangeStart(adjustedStart);
  //   }
  // }, [bookings, rangeStart]);

  useEffect(() => {
    const viewport = timelineViewportRef.current;
    if (!viewport) return;

    const updateWidth = () => {
      const nextWidth = Math.max(0, Math.floor(viewport.clientWidth));
      setTimelineViewportWidth((previous) =>
        previous === nextWidth ? previous : nextWidth,
      );
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => {
        window.removeEventListener('resize', updateWidth);
      };
    }

    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const parsedRangeStart = useMemo(
    () => toDate(rangeStart) ?? new Date(),
    [rangeStart],
  );
  const parsedRangeEnd = useMemo(() => {
    const end = new Date(parsedRangeStart);
    end.setUTCDate(end.getUTCDate() + (rangeDays - 1));
    return end;
  }, [parsedRangeStart, rangeDays]);

  const days = useMemo(() => {
    return Array.from({ length: rangeDays }, (_, idx) => {
      const date = new Date(parsedRangeStart);
      date.setUTCDate(parsedRangeStart.getUTCDate() + idx);
      return {
        date,
        label: formatDate(toIsoDate(date), 'short'),
        iso: toIsoDate(date),
      };
    });
  }, [parsedRangeStart, rangeDays]);

  const rangeStartMs = parsedRangeStart.getTime();
  const rangeEndExclusiveMs = startOfUtcDay(parsedRangeEnd).getTime() + DAY_MS;

  const bookingIntervalsById = useMemo(() => {
    const map = new Map<string, BookingInterval>();
    for (const booking of bookings) {
      const interval = getBookingInterval(booking);
      if (interval) {
        map.set(booking.id, interval);
      }
    }
    return map;
  }, [bookings]);

  const groupedBookings = useMemo(() => {
    const map = new Map<string, VisibleBooking[]>();

    bookings.forEach((booking) => {
      const vehicleId = booking.assignedFleetVehicleId;
      if (!vehicleId) return;
      const interval = bookingIntervalsById.get(booking.id);
      if (!interval) return;
      const clamped = clampBookingToRange(
        booking,
        interval,
        rangeStartMs,
        rangeEndExclusiveMs,
      );
      if (!clamped) return;

      const existing = map.get(vehicleId) ?? [];
      existing.push(clamped);
      map.set(vehicleId, existing);
    });

    map.forEach((vehicleBookings, vehicleId) => {
      vehicleBookings.sort((a, b) => a.offsetDays - b.offsetDays);
      map.set(vehicleId, vehicleBookings);
    });

    return map;
  }, [bookings, bookingIntervalsById, rangeEndExclusiveMs, rangeStartMs]);

  const carOutBookingIdSet = useMemo(
    () => new Set(carOutBookingIds),
    [carOutBookingIds],
  );

  const bookingsByVehicle = useMemo(() => {
    const map = new Map<
      string,
      { bookingId: string; interval: BookingInterval }[]
    >();

    bookings.forEach((booking) => {
      if (!booking.assignedFleetVehicleId) return;
      const interval = bookingIntervalsById.get(booking.id);
      if (!interval) return;
      const entry = map.get(booking.assignedFleetVehicleId) ?? [];
      entry.push({
        bookingId: booking.id,
        interval,
      });
      map.set(booking.assignedFleetVehicleId, entry);
    });

    return map;
  }, [bookings, bookingIntervalsById]);

  const sortedFleetVehicles = useMemo(() => {
    const list = [...fleetVehicles];
    list.sort((a, b) => {
      if (fleetSort === 'location') {
        const locationCompare = compareStrings(a.location, b.location);
        if (locationCompare !== 0) return locationCompare;
      }
      const carCompare = compareStrings(a.carLabel, b.carLabel);
      if (carCompare !== 0) return carCompare;
      return compareStrings(a.plate, b.plate);
    });
    return list;
  }, [fleetSort, fleetVehicles]);

  const locationLegend = useMemo(() => {
    const items = new Map<string, { label: string; color: string }>();
    for (const vehicle of fleetVehicles) {
      const label = getLocationLabel(vehicle.location);
      const color = getLocationColor(vehicle.location);
      const key = `${label}|${color.toLowerCase()}`;
      if (!items.has(key)) {
        items.set(key, { label, color });
      }
    }
    return Array.from(items.values()).sort((a, b) =>
      compareStrings(a.label, b.label),
    );
  }, [fleetVehicles]);

  const fleetVehicleById = useMemo(
    () => new Map(fleetVehicles.map((vehicle) => [vehicle.id, vehicle])),
    [fleetVehicles],
  );

  const serviceWindowByVehicle = useMemo(
    () =>
      new Map(
        fleetVehicles.map((vehicle) => [
          vehicle.id,
          getFleetServiceWindowRangeFromNotes(vehicle.notes),
        ]),
      ),
    [fleetVehicles],
  );

  const isVehicleAvailable = (
    payload: DragPayload,
    vehicleId: string,
  ): boolean => {
    const requestedInterval = bookingIntervalsById.get(payload.bookingId);
    if (!requestedInterval) return false;
    const vehicle = fleetVehicleById.get(vehicleId);
    if (
      vehicle &&
      isFleetBlockedByServiceWindow({
        notes: vehicle.notes,
        rentalStart: requestedInterval.start,
        rentalEnd: requestedInterval.end,
      })
    ) {
      return false;
    }

    const bookedSlots = bookingsByVehicle.get(vehicleId) ?? [];
    return !bookedSlots.some(
      (slot) =>
        slot.bookingId !== payload.bookingId &&
        intervalsOverlap(requestedInterval, slot.interval),
    );
  };

  const unassignedBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          !booking.assignedFleetVehicleId &&
          booking.rentalStart &&
          booking.rentalEnd &&
          (() => {
            const end = toDate(booking.rentalEnd);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return end ? end >= today : false;
          })(),
      ),
    [bookings],
  );

  const getAvailableFleetVehicles = (bookingId: string) => {
    const requestedInterval = bookingIntervalsById.get(bookingId);
    if (!requestedInterval) return sortedFleetVehicles;

    return sortedFleetVehicles.filter((vehicle) => {
      if (
        isFleetBlockedByServiceWindow({
          notes: vehicle.notes,
          rentalStart: requestedInterval.start,
          rentalEnd: requestedInterval.end,
        })
      ) {
        return false;
      }

      const bookedSlots = bookingsByVehicle.get(vehicle.id) ?? [];
      return !bookedSlots.some(
        (slot) =>
          slot.bookingId !== bookingId &&
          intervalsOverlap(requestedInterval, slot.interval),
      );
    });
  };

  const getAssignableUnassignedBookings = (vehicleId: string) =>
    unassignedBookings.filter((booking) =>
      isVehicleAvailable(
        {
          bookingId: booking.id,
        },
        vehicleId,
      ),
    );

  const fittedDayWidth =
    rangeDays > 0 && timelineViewportWidth > 0
      ? Math.floor(timelineViewportWidth / rangeDays)
      : DEFAULT_DAY_COLUMN_WIDTH;
  const dayColumnWidth = Math.max(MIN_DAY_COLUMN_WIDTH, fittedDayWidth);
  const timelineWidth = days.length * dayColumnWidth;
  const dayGridTemplate = `repeat(${days.length}, ${dayColumnWidth}px)`;

  const handleAssign = (bookingId: string, fleetVehicleId: string | null) => {
    setMessage(null);
    startTransition(async () => {
      const result = await assignFleetVehicleToBookingAction({
        bookingId,
        fleetVehicleId,
      });
      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result?.success ?? 'Mentve.');
      router.refresh();
    });
  };

  const closeBookingContextMenu = () => {
    setContextMenuBookingId(null);
    setContextMenuPoint(null);
  };

  const closeRowContextMenu = () => {
    setRowContextMenuVehicleId(null);
    setRowContextMenuPoint(null);
    setRowContextMenuDateIso(null);
  };

  const openBookingContextMenu = (
    event: MouseEvent<HTMLElement>,
    bookingId: string,
  ) => {
    setRowContextMenuVehicleId(null);
    setRowContextMenuPoint(null);
    setRowContextMenuDateIso(null);
    setContextMenuPoint({
      x: event.clientX,
      y: event.clientY,
    });
    setContextMenuBookingId(bookingId);
  };

  const openRowContextMenu = (
    event: MouseEvent<HTMLElement>,
    vehicleId: string,
  ) => {
    if (activeDrag) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        '[data-booking-chip="true"],a,button,select,input,textarea,[role="menu"]',
      )
    ) {
      return;
    }

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const clickedDayIndex =
      days.length > 0
        ? Math.max(
            0,
            Math.min(days.length - 1, Math.floor(relativeX / dayColumnWidth)),
          )
        : 0;
    const clickedDateIso = days[clickedDayIndex]?.iso ?? days[0]?.iso ?? '';

    closeBookingContextMenu();
    setRowContextMenuPoint({ x: event.clientX, y: event.clientY });
    setRowContextMenuVehicleId(vehicleId);
    setRowContextMenuDateIso(clickedDateIso);
  };

  const buildDragPayload = (
    booking: BookingCalendarBooking,
    sourceVehicleId?: string,
  ): DragPayload | null => {
    const interval = bookingIntervalsById.get(booking.id);
    if (!interval) return null;
    return {
      bookingId: booking.id,
      sourceVehicleId,
    };
  };

  const readDragPayload = (
    event: DragEvent<HTMLElement>,
  ): DragPayload | null => {
    const raw = event.dataTransfer.getData('application/json');
    if (raw) {
      try {
        return JSON.parse(raw) as DragPayload;
      } catch {
        return activeDrag;
      }
    }
    return activeDrag;
  };

  const handleDragEnd = () => {
    setActiveDrag(null);
    setHoverVehicleId(null);
  };

  const handleVehicleBookingDragStart = (
    event: DragEvent<HTMLElement>,
    booking: BookingCalendarBooking,
    sourceVehicleId?: string,
    disabled?: boolean,
  ) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    const payload = buildDragPayload(booking, sourceVehicleId);
    if (!payload) {
      event.preventDefault();
      return;
    }

    const target = event.target as HTMLElement;
    if (target?.closest('select,button,input,textarea')) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    setActiveDrag(payload);
    setHoverVehicleId(null);
  };

  const handleUnassignedBookingDragStart = (
    event: DragEvent<HTMLElement>,
    booking: BookingCalendarBooking,
  ) => {
    handleVehicleBookingDragStart(event, booking);
  };

  const getVehicleDropState = (vehicleId: string): DropState => {
    if (!activeDrag || hoverVehicleId !== vehicleId) return null;
    return isVehicleAvailable(activeDrag, vehicleId) ? 'allowed' : 'blocked';
  };

  const handleVehicleRowDragEnter = (vehicleId: string) => {
    if (activeDrag) {
      setHoverVehicleId(vehicleId);
    }
  };

  const handleVehicleRowDragOver = (
    event: DragEvent<HTMLElement>,
    vehicleId: string,
  ) => {
    if (!activeDrag) return;

    event.preventDefault();
    const isAllowed = isVehicleAvailable(activeDrag, vehicleId);
    event.dataTransfer.dropEffect = isAllowed ? 'move' : 'none';
    if (hoverVehicleId !== vehicleId) {
      setHoverVehicleId(vehicleId);
    }
  };

  const handleVehicleRowDragLeave = (event: DragEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) return;
    setHoverVehicleId(null);
  };

  const handleDropOnVehicle = (
    event: DragEvent<HTMLElement>,
    vehicleId: string,
  ) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload) return;

    if (!isVehicleAvailable(payload, vehicleId)) {
      setMessage('Az autó már foglalt ebben az időszakban.');
      setHoverVehicleId(null);
      return;
    }
    if (payload.sourceVehicleId === vehicleId) {
      setHoverVehicleId(null);
      return;
    }

    setMessage(null);
    startTransition(async () => {
      setHoverVehicleId(null);
      const result = await assignFleetVehicleToBookingAction({
        bookingId: payload.bookingId,
        fleetVehicleId: vehicleId,
      });
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      setMessage(result?.success ?? 'Mentve.');
      router.refresh();
    });
  };

  const handleUnassignedDragOver = (event: DragEvent<HTMLElement>) => {
    if (!activeDrag) return;
    event.preventDefault();
    if (hoverVehicleId) {
      setHoverVehicleId(null);
    }
  };

  const handleDropToUnassigned = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload) return;

    setMessage(null);
    startTransition(async () => {
      setHoverVehicleId(null);
      const result = await assignFleetVehicleToBookingAction({
        bookingId: payload.bookingId,
        fleetVehicleId: null,
      });
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      setMessage(result?.success ?? 'Mentve.');
      router.refresh();
    });
  };

  return {
    rangeStart,
    setRangeStart,
    rangeDays,
    setRangeDays,
    fleetSort,
    setFleetSort,
    message,
    isPending,
    parsedRangeStart,
    parsedRangeEnd,
    days,
    sortedFleetVehicles,
    locationLegend,
    groupedBookings,
    serviceWindowByVehicle,
    carOutBookingIdSet,
    unassignedBookings,
    timelineViewportRef,
    firstColumnWidth: FIRST_COLUMN_WIDTH,
    rowStyle: ROW_STYLE,
    bookingChipStyleBase: BOOKING_CHIP_STYLE_BASE,
    dayColumnWidth,
    timelineWidth,
    dayGridTemplate,
    rangeStartMs,
    contextMenuBookingId,
    contextMenuPoint,
    rowContextMenuVehicleId,
    rowContextMenuPoint,
    rowContextMenuDateIso,
    closeBookingContextMenu,
    closeRowContextMenu,
    openBookingContextMenu,
    openRowContextMenu,
    handleAssign,
    getAvailableFleetVehicles,
    getAssignableUnassignedBookings,
    getVehicleDropState,
    handleVehicleRowDragEnter,
    handleVehicleRowDragOver,
    handleVehicleRowDragLeave,
    handleDropOnVehicle,
    handleDropToUnassigned,
    handleVehicleBookingDragStart,
    handleUnassignedBookingDragStart,
    handleUnassignedDragOver,
    handleDragEnd,
  };
}

export type BookingCalendarModel = ReturnType<typeof useBookingCalendar>;
