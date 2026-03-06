'use client';

import { useMemo, useState, useTransition } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

import { assignFleetVehicleToBookingAction } from '@/actions/assignFleetVehicleToBookingAction';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getFleetServiceWindowRangeFromNotes,
  isFleetBlockedByServiceWindow,
} from '@/lib/fleet-service-window';
import { getStatusMeta } from '@/lib/status';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BookingPricing } from '@/data-service/bookings';

type BookingCalendarBooking = {
  id: string;
  humanId?: string | null;
  contactName: string;
  rentalStart?: string;
  rentalEnd?: string;
  status?: string | null;
  assignedFleetVehicleId?: string;
  carLabel?: string | null;
  deliveryLocation?: string | null;
  deliveryIsland?: string | null;
  pricing?: BookingPricing | null;
};

type BookingCalendarVehicle = {
  id: string;
  plate: string;
  status: string;
  carLabel: string;
  carId: string;
  location: string;
  notes?: string | null;
  odometer: number;
  serviceIntervalKm?: number | null;
  lastServiceMileage?: number | null;
};

type BookingCalendarProps = {
  bookings: BookingCalendarBooking[];
  fleetVehicles: BookingCalendarVehicle[];
  carOutBookingIds: string[];
};

type FleetSortKey = 'car' | 'location';

type UnassignedBookingCardProps = {
  booking: BookingCalendarBooking;
  fleetVehicles: BookingCalendarVehicle[];
  disabled?: boolean;
  onAssign: (bookingId: string, vehicleId: string) => void;
  onDragStart?: (
    event: DragEvent<HTMLDivElement>,
    booking: BookingCalendarBooking,
  ) => void;
  onDragEnd?: () => void;
};

const UnassignedBookingCard = ({
  booking,
  fleetVehicles,
  disabled,
  onAssign,
  onDragStart,
  onDragEnd,
}: UnassignedBookingCardProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const selectedVehicleDetails = fleetVehicles.find(
    (vehicle) => vehicle.id === selectedVehicle,
  );
  const selectedVehicleColor = selectedVehicleDetails
    ? getLocationColor(selectedVehicleDetails.location)
    : '#888888';

  const meta = getStatusMeta(booking.status);
  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border px-3 py-3',
        disabled ? 'opacity-70' : 'cursor-grab active:cursor-grabbing',
      )}
      draggable={!disabled}
      onDragStart={(event) => onDragStart?.(event, booking)}
      onDragEnd={() => onDragEnd?.()}
    >
      <div className='font-semibold'>
        <div className='flex items-center gap-2'>
          <span>
            {`${booking.humanId ? `(${booking.humanId}) ` : ''}${booking.contactName}${booking.carLabel ? ` - ${booking.carLabel}` : ''}`}
          </span>
          {meta?.label && (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${meta.badge}`}
            >
              {meta.label}
            </span>
          )}
        </div>
      </div>
      <div className='text-sm text-muted-foreground'>
        {booking.rentalStart} → {booking.rentalEnd}
      </div>
      <div className='text-sm text-muted-foreground mb-4'>
        Átvétel helye:{' '}
        <span className='font-medium text-foreground'>
          {booking.deliveryLocation?.trim() || '—'}
        </span>
      </div>

      <div className='space-y-1'>
        <div className='relative w-full'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type='button'
                variant='outline'
                className='peer h-12 w-full justify-start font-normal'
                disabled={disabled || fleetVehicles.length === 0}
              >
                <span className='inline-flex items-center gap-2 truncate'>
                  <span
                    className='h-2.5 w-2.5 shrink-0 rounded-full border border-black/10'
                    style={{ backgroundColor: selectedVehicleColor }}
                    aria-hidden
                  />
                  <span className='truncate'>
                    {selectedVehicleDetails
                      ? `${selectedVehicleDetails.plate} - ${selectedVehicleDetails.carLabel}`
                      : fleetVehicles.length === 0
                        ? 'Nincs elérhető autó'
                        : 'Válassz autót'}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              className='w-[var(--radix-dropdown-menu-trigger-width)]'
            >
              {fleetVehicles.length === 0 ? (
                <DropdownMenuItem disabled>
                  Nincs elérhető autó
                </DropdownMenuItem>
              ) : (
                fleetVehicles.map((vehicle) => (
                  <DropdownMenuItem
                    key={vehicle.id}
                    className='cursor-pointer transition-colors hover:!bg-sky-100 hover:!text-slate-900 data-[highlighted]:!bg-sky-100 data-[highlighted]:!text-slate-900 dark:hover:!bg-sky-900/40 dark:hover:!text-slate-50 dark:data-[highlighted]:!bg-sky-900/40 dark:data-[highlighted]:!text-slate-50'
                    onSelect={() => setSelectedVehicle(vehicle.id)}
                  >
                    <span className='inline-flex items-center gap-2'>
                      <span
                        className='h-2.5 w-2.5 rounded-full border border-black/10'
                        style={{
                          backgroundColor: getLocationColor(vehicle.location),
                        }}
                        aria-hidden
                      />
                      <span>{vehicle.plate}</span>
                      <span className='text-muted-foreground'>
                        - {vehicle.carLabel}
                      </span>
                      <span className='text-muted-foreground'>
                        - {booking.humanId}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <label className='pointer-events-none absolute -top-2 left-3 translate-x-2 bg-background px-2 text-sm text-slate-600'>
            Flotta autó
          </label>
        </div>
      </div>
      <Button
        type='button'
        className='w-full'
        disabled={disabled || !selectedVehicle}
        onClick={() => onAssign(booking.id, selectedVehicle)}
      >
        Hozzárendelés
      </Button>
    </div>
  );
};

type VisibleBooking = BookingCalendarBooking & {
  startIndex: number;
  span: number;
};

type DragPayload = {
  bookingId: string;
  sourceVehicleId?: string;
  rentalStart: string;
  rentalEnd: string;
};

const formatDate = (value: Date) =>
  value.toLocaleDateString('hu-HU', {
    month: '2-digit',
    day: '2-digit',
  });

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDate = (value?: string) =>
  value ? new Date(`${value}T00:00:00`) : null;

const compareStrings = (a?: string | null, b?: string | null) =>
  (a ?? '').localeCompare(b ?? '', 'hu', { sensitivity: 'base' });

const getServiceRemainingKm = (vehicle: BookingCalendarVehicle) => {
  if (vehicle.serviceIntervalKm == null || vehicle.lastServiceMileage == null) {
    return null;
  }
  const nextDue = vehicle.lastServiceMileage + vehicle.serviceIntervalKm;
  const remaining = nextDue - (vehicle.odometer ?? 0);
  return Number.isFinite(remaining) ? remaining : null;
};

const getLocationColor = (location?: string | null) => {
  if (!location) return '#888888';
  const match = location.match(/#(?:[0-9a-fA-F]{3}){1,2}$/);
  return match?.[0] ?? '#888888';
};

const getLocationLabel = (location?: string | null) => {
  const trimmed = location?.trim();
  if (!trimmed) return 'Nincs megadva';
  const withoutColor = trimmed.replace(/\s*#(?:[0-9a-fA-F]{3}){1,2}\s*$/, '');
  const normalized = withoutColor.trim();
  return normalized || trimmed;
};

const normalizeIsland = (value?: string | null) =>
  value
    ?.trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') ?? '';

const getBookingIslandColor = (island?: string | null) => {
  const normalized = normalizeIsland(island);
  if (normalized.includes('lanzarote')) return '#0000ff';
  if (normalized.includes('fuerteventura')) return '#ffa500';
  return '#64748b';
};

const getBookingIslandLabel = (island?: string | null) => {
  const normalized = normalizeIsland(island);
  if (normalized.includes('lanzarote')) return 'Lanzarote';
  if (normalized.includes('fuerteventura')) return 'Fuerteventura';
  return 'Ismeretlen sziget';
};

const formatFeeWithEuro = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return '—';
  if (trimmed.includes('€') || /\b(?:eur|euro)\b/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} €`;
};

const daysBetween = (start: Date, end: Date) =>
  Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );

const clampBookingToRange = (
  booking: BookingCalendarBooking,
  rangeStart: Date,
  rangeEnd: Date,
): VisibleBooking | null => {
  const start = toDate(booking.rentalStart);
  const end = toDate(booking.rentalEnd);
  if (!start || !end) return null;
  if (end < rangeStart || start > rangeEnd) return null;

  const visibleStart = start < rangeStart ? rangeStart : start;
  const visibleEnd = end > rangeEnd ? rangeEnd : end;
  const startIndex = daysBetween(rangeStart, visibleStart);
  const span = daysBetween(visibleStart, visibleEnd) + 1;

  return {
    ...booking,
    startIndex,
    span,
  };
};

const rangesOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) => {
  const fromA = toDate(startA);
  const toA = toDate(endA);
  const fromB = toDate(startB);
  const toB = toDate(endB);
  if (!fromA || !toA || !fromB || !toB) return false;
  return fromA <= toB && toA >= fromB;
};

export function BookingCalendar({
  bookings,
  fleetVehicles,
  carOutBookingIds,
}: BookingCalendarProps) {
  const router = useRouter();
  const [rangeStart, setRangeStart] = useState(() => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    return iso;
  });
  const [rangeDays, setRangeDays] = useState(14);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const [hoverVehicleId, setHoverVehicleId] = useState<string | null>(null);
  const [fleetSort, setFleetSort] = useState<FleetSortKey>('car');
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

  const parsedRangeStart = useMemo(
    () => toDate(rangeStart) ?? new Date(),
    [rangeStart],
  );
  const parsedRangeEnd = useMemo(() => {
    const end = new Date(parsedRangeStart);
    end.setDate(end.getDate() + (rangeDays - 1));
    return end;
  }, [parsedRangeStart, rangeDays]);

  const days = useMemo(() => {
    return Array.from({ length: rangeDays }, (_, idx) => {
      const date = new Date(parsedRangeStart);
      date.setDate(parsedRangeStart.getDate() + idx);
      return {
        date,
        label: formatDate(date),
        iso: toIsoDate(date),
      };
    });
  }, [parsedRangeStart, rangeDays]);

  const groupedBookings = useMemo(() => {
    const map = new Map<string, VisibleBooking[]>();
    bookings.forEach((booking) => {
      const vehicleId = booking.assignedFleetVehicleId;
      if (!vehicleId) return;
      const clamped = clampBookingToRange(
        booking,
        parsedRangeStart,
        parsedRangeEnd,
      );
      if (!clamped) return;

      const existing = map.get(vehicleId) ?? [];
      existing.push(clamped);
      map.set(vehicleId, existing);
    });
    map.forEach((vehicleBookings, vehicleId) => {
      vehicleBookings.sort((a, b) => a.startIndex - b.startIndex);
      map.set(vehicleId, vehicleBookings);
    });
    return map;
  }, [bookings, parsedRangeStart, parsedRangeEnd]);

  const carOutBookingIdSet = useMemo(
    () => new Set(carOutBookingIds),
    [carOutBookingIds],
  );

  const bookingsByVehicle = useMemo(() => {
    const map = new Map<
      string,
      { bookingId: string; rentalStart: string; rentalEnd: string }[]
    >();
    bookings.forEach((booking) => {
      if (
        !booking.assignedFleetVehicleId ||
        !booking.rentalStart ||
        !booking.rentalEnd
      )
        return;
      const entry = map.get(booking.assignedFleetVehicleId) ?? [];
      entry.push({
        bookingId: booking.id,
        rentalStart: booking.rentalStart,
        rentalEnd: booking.rentalEnd,
      });
      map.set(booking.assignedFleetVehicleId, entry);
    });
    return map;
  }, [bookings]);

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

  const getAvailableFleetVehicles = (
    bookingId: string,
    rentalStart?: string,
    rentalEnd?: string,
  ) => {
    if (!rentalStart || !rentalEnd) return sortedFleetVehicles;
    const rentalStartDate = toDate(rentalStart);
    const rentalEndDate = toDate(rentalEnd);
    if (!rentalStartDate || !rentalEndDate) return sortedFleetVehicles;
    return sortedFleetVehicles.filter((vehicle) => {
      if (
        isFleetBlockedByServiceWindow({
          notes: vehicle.notes,
          rentalStart: rentalStartDate,
          rentalEnd: rentalEndDate,
        })
      ) {
        return false;
      }

      const bookedSlots = bookingsByVehicle.get(vehicle.id) ?? [];
      return !bookedSlots.some(
        (slot) =>
          slot.bookingId !== bookingId &&
          rangesOverlap(
            rentalStart,
            rentalEnd,
            slot.rentalStart,
            slot.rentalEnd,
          ),
      );
    });
  };

  const isVehicleAvailable = (
    payload: DragPayload,
    vehicleId: string,
  ): boolean => {
    const vehicle = fleetVehicleById.get(vehicleId);
    const payloadStartDate = toDate(payload.rentalStart);
    const payloadEndDate = toDate(payload.rentalEnd);
    if (
      vehicle &&
      payloadStartDate &&
      payloadEndDate &&
      isFleetBlockedByServiceWindow({
        notes: vehicle.notes,
        rentalStart: payloadStartDate,
        rentalEnd: payloadEndDate,
      })
    ) {
      return false;
    }

    const bookedSlots = bookingsByVehicle.get(vehicleId) ?? [];
    return !bookedSlots.some(
      (slot) =>
        slot.bookingId !== payload.bookingId &&
        rangesOverlap(
          payload.rentalStart,
          payload.rentalEnd,
          slot.rentalStart,
          slot.rentalEnd,
        ),
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

  const firstColumnWidth = 380;
  const dayColumnWidth = 100;
  const dayGridTemplate = `repeat(${days.length}, ${dayColumnWidth}px)`;
  const timelineWidth = days.length * dayColumnWidth;
  const rowHeightClass = 'h-[56px]';

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

  const closeRowContextMenu = () => {
    setRowContextMenuVehicleId(null);
    setRowContextMenuPoint(null);
    setRowContextMenuDateIso(null);
  };

  const buildDragPayload = (
    booking: BookingCalendarBooking,
    sourceVehicleId?: string,
  ): DragPayload | null => {
    if (!booking.rentalStart || !booking.rentalEnd) return null;
    const start = toDate(booking.rentalStart);
    const end = toDate(booking.rentalEnd);
    if (!start || !end) return null;
    return {
      bookingId: booking.id,
      sourceVehicleId,
      rentalStart: booking.rentalStart,
      rentalEnd: booking.rentalEnd,
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

  const handleDropOnVehicle = (
    event: DragEvent<HTMLElement>,
    vehicleId: string,
  ) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload) return;
    if (!payload.rentalStart || !payload.rentalEnd) return;

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

  const openRowContextMenu = (
    event: React.MouseEvent<HTMLElement>,
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
    setContextMenuBookingId(null);
    setContextMenuPoint(null);
    setRowContextMenuPoint({ x: event.clientX, y: event.clientY });
    setRowContextMenuVehicleId(vehicleId);
    setRowContextMenuDateIso(clickedDateIso);
  };

  const getAssignableUnassignedBookings = (vehicleId: string) =>
    unassignedBookings.filter((booking) => {
      if (!booking.rentalStart || !booking.rentalEnd) return false;
      return isVehicleAvailable(
        {
          bookingId: booking.id,
          rentalStart: booking.rentalStart,
          rentalEnd: booking.rentalEnd,
        },
        vehicleId,
      );
    });

  return (
    <div className='space-y-6 h-full max-w-screen overflow-hidden min-w-0'>
      <div className='flex flex-wrap gap-3 rounded-xl border bg-card/40 p-4 shadow-sm items-center'>
        <div className='flex items-center gap-2'>
          <label
            className='text-sm text-muted-foreground'
            htmlFor='range-start'
          >
            Kezdő dátum
          </label>
          <input
            id='range-start'
            type='date'
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className='rounded-md border px-3 py-2 text-sm'
          />
        </div>
        <div className='flex items-center gap-2'>
          <label className='text-sm text-muted-foreground' htmlFor='range-days'>
            Időtartam
          </label>
          <select
            id='range-days'
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            className='rounded-md border px-3 py-2 text-sm'
          >
            <option value={7}>7 nap</option>
            <option value={14}>14 nap</option>
            <option value={21}>21 nap</option>
            <option value={30}>30 nap</option>
          </select>
        </div>
        <div className='flex items-center gap-2'>
          <label className='text-sm text-muted-foreground' htmlFor='fleet-sort'>
            Rendezés
          </label>
          <select
            id='fleet-sort'
            value={fleetSort}
            onChange={(e) => setFleetSort(e.target.value as FleetSortKey)}
            className='rounded-md border px-3 py-2 text-sm'
          >
            <option value='car'>Autó típus</option>
            <option value='location'>Helyszín</option>
          </select>
        </div>
        {message && (
          <div className='text-sm font-medium text-emerald-600'>{message}</div>
        )}
      </div>

      <div className='space-y-3 rounded-xl border bg-card/40 p-4 shadow-sm min-w-0'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Flotta idővonal</h2>
          <span className='text-sm text-muted-foreground'>
            {formatDate(parsedRangeStart)} – {formatDate(parsedRangeEnd)}
          </span>
        </div>
        <div className='flex flex-col flex-wrap items-start gap-2 rounded-lg border border-slate-200 bg-muted/20 px-3 py-2 text-xs text-muted-foreground'>
          <div className='flex flex-wrap gap-4'>
            <span className='font-semibold text-foreground'>
              Jelmagyarázat:
            </span>
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

          {locationLegend.length > 0 && (
            <div className='flex flex-wrap gap-4 items-center'>
              <span className='font-semibold text-foreground'>Helyszínek:</span>
              {locationLegend.map((item) => (
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
        <div className='rounded-lg border border-slate-300 bg-background min-w-0'>
          <div className='flex min-w-0'>
            <div
              className='shrink-0 border-r border-slate-300 bg-background'
              style={{ width: firstColumnWidth }}
            >
              <div className='flex h-11 items-center border-b border-slate-300 bg-muted/40 px-3 text-xs font-semibold uppercase text-muted-foreground'>
                Autó
              </div>
              {sortedFleetVehicles.map((vehicle, index) => {
                const remainingServiceKm = getServiceRemainingKm(vehicle);
                const isServiceDueSoon =
                  remainingServiceKm != null && remainingServiceKm <= 1000;
                const dropState =
                  activeDrag && hoverVehicleId === vehicle.id
                    ? isVehicleAvailable(activeDrag, vehicle.id)
                      ? 'allowed'
                      : 'blocked'
                    : null;
                const isAllowedDrop = dropState === 'allowed';
                const isBlockedDrop = dropState === 'blocked';
                const locationColor = getLocationColor(vehicle.location);
                const showDateRow =
                  (index + 1) % 10 === 0 &&
                  index < sortedFleetVehicles.length - 1;

                return (
                  <div key={vehicle.id}>
                    <div
                      className={cn(
                        `flex ${rowHeightClass} items-center  gap-3 border-b border-slate-300 bg-background px-3 transition-colors`,
                        isAllowedDrop && 'bg-emerald-100/70',
                        isBlockedDrop && 'bg-rose-100/70',
                      )}
                      onDragEnter={() => {
                        if (activeDrag) setHoverVehicleId(vehicle.id);
                      }}
                      onDragOver={(event) => {
                        if (activeDrag) {
                          event.preventDefault();
                          const isAllowed = isVehicleAvailable(
                            activeDrag,
                            vehicle.id,
                          );
                          event.dataTransfer.dropEffect = isAllowed
                            ? 'move'
                            : 'none';
                          if (hoverVehicleId !== vehicle.id) {
                            setHoverVehicleId(vehicle.id);
                          }
                        }
                      }}
                      onDragLeave={(event) => {
                        const nextTarget = event.relatedTarget as Node | null;
                        if (
                          nextTarget &&
                          event.currentTarget.contains(nextTarget)
                        )
                          return;
                        setHoverVehicleId(null);
                      }}
                      onDrop={(event) => handleDropOnVehicle(event, vehicle.id)}
                    >
                      <div className='flex items-center gap-2 font-semibold whitespace-nowrap'>
                        {isServiceDueSoon && (
                          <span
                            className='text-rose-400 cursor-help'
                            title={`Szerviz esedékes ${Math.max(0, Math.round(remainingServiceKm ?? 0))} km-en belül`}
                          >
                            <AlertTriangle className='h-4 w-4' />
                          </span>
                        )}
                        <Link
                          href={`/cars/${vehicle.carId}/edit/fleet/${vehicle.id}`}
                          className='hover:underline'
                        >
                          {vehicle.plate}
                        </Link>
                      </div>
                      <div className='text-xs text-muted-foreground truncate'>
                        {vehicle.carLabel}
                      </div>
                      <span
                        className='h-2.5 w-2.5 rounded-full border border-black/10'
                        style={{
                          backgroundColor: locationColor ?? '#888888',
                        }}
                        aria-hidden
                      />
                    </div>
                    {showDateRow && (
                      <div className='flex h-11 items-center border-b border-slate-300 bg-muted/20 px-3 text-xs font-semibold uppercase text-muted-foreground'>
                        {/* Dátumok */}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className='min-w-0 flex-1 overflow-x-auto'>
              <div style={{ width: timelineWidth }}>
                <div
                  className='grid h-11 border-b border-slate-300 bg-muted/40 text-xs font-semibold uppercase text-muted-foreground'
                  style={{ gridTemplateColumns: dayGridTemplate }}
                >
                  {days.map((day, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-center border-l border-slate-300 px-2 text-center first:border-l-0'
                    >
                      {day.label}
                    </div>
                  ))}
                </div>

                {sortedFleetVehicles.map((vehicle, index) => {
                  const bookingsForVehicle =
                    groupedBookings.get(vehicle.id) ?? [];
                  const serviceWindow = serviceWindowByVehicle.get(vehicle.id);
                  const firstBookingForVehicle = bookingsForVehicle[0];
                  const bookingIslandColor = getBookingIslandColor(
                    firstBookingForVehicle?.deliveryIsland,
                  );
                  const assignableUnassignedBookings =
                    getAssignableUnassignedBookings(vehicle.id);
                  const menuItemStyle = {
                    '--fleet-color':
                      bookingIslandColor ?? getLocationColor(vehicle.location),
                  } as CSSProperties;
                  const dropState =
                    activeDrag && hoverVehicleId === vehicle.id
                      ? isVehicleAvailable(activeDrag, vehicle.id)
                        ? 'allowed'
                        : 'blocked'
                      : null;
                  const isAllowedDrop = dropState === 'allowed';
                  const isBlockedDrop = dropState === 'blocked';
                  const showDateRow =
                    (index + 1) % 10 === 0 &&
                    index < sortedFleetVehicles.length - 1;

                  return (
                    <div key={vehicle.id}>
                      <div
                        className={cn(
                          `${rowHeightClass} relative grid border-b border-slate-300 text-sm transition-colors cursor-pointer`,
                          isAllowedDrop && 'bg-emerald-100/70',
                          isBlockedDrop && 'bg-rose-100/70',
                        )}
                        style={{ gridTemplateColumns: dayGridTemplate }}
                        onDragEnter={() => {
                          if (activeDrag) setHoverVehicleId(vehicle.id);
                        }}
                        onDragOver={(event) => {
                          if (activeDrag) {
                            event.preventDefault();
                            const isAllowed = isVehicleAvailable(
                              activeDrag,
                              vehicle.id,
                            );
                            event.dataTransfer.dropEffect = isAllowed
                              ? 'move'
                              : 'none';
                            if (hoverVehicleId !== vehicle.id) {
                              setHoverVehicleId(vehicle.id);
                            }
                          }
                        }}
                        onDragLeave={(event) => {
                          const nextTarget = event.relatedTarget as Node | null;
                          if (
                            nextTarget &&
                            event.currentTarget.contains(nextTarget)
                          )
                            return;
                          setHoverVehicleId(null);
                        }}
                        onDrop={(event) =>
                          handleDropOnVehicle(event, vehicle.id)
                        }
                        onClick={(event) =>
                          openRowContextMenu(event, vehicle.id)
                        }
                        onContextMenu={(event) =>
                          openRowContextMenu(event, vehicle.id)
                        }
                      >
                        <DropdownMenu
                          open={rowContextMenuVehicleId === vehicle.id}
                          onOpenChange={(open) => {
                            if (
                              !open &&
                              rowContextMenuVehicleId === vehicle.id
                            ) {
                              closeRowContextMenu();
                            }
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <span
                              aria-hidden='true'
                              className='pointer-events-none fixed h-1 w-1'
                              style={{
                                left: rowContextMenuPoint?.x ?? 0,
                                top: rowContextMenuPoint?.y ?? 0,
                              }}
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='start'>
                            <DropdownMenuItem
                              className='data-[highlighted]:bg-(--fleet-color) data-[highlighted]:text-primary-foreground'
                              style={menuItemStyle}
                              onSelect={() => {
                                closeRowContextMenu();
                                router.push(
                                  '/bookings/new?' +
                                    new URLSearchParams({
                                      vehicleId: vehicle.id,
                                      rentalStart:
                                        rowContextMenuDateIso ??
                                        days[0]?.iso ??
                                        '',
                                    }).toString(),
                                );
                              }}
                            >
                              Új foglalás hozzáadása
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger
                                className='data-[state=open]:bg-(--fleet-color) data-[state=open]:text-primary-foreground data-[highlighted]:bg-(--fleet-color) data-[highlighted]:text-primary-foreground'
                                style={menuItemStyle}
                              >
                                Meglévő foglalás hozzárendelése
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent
                                className='max-h-80 w-[340px] overflow-y-auto'
                                sideOffset={4}
                              >
                                {assignableUnassignedBookings.length === 0 ? (
                                  <DropdownMenuItem disabled>
                                    Nincs hozzárendelhető foglalás.
                                  </DropdownMenuItem>
                                ) : (
                                  assignableUnassignedBookings.map(
                                    (unassignedBooking) => (
                                      <DropdownMenuItem
                                        key={unassignedBooking.id}
                                        className='cursor-pointer transition-colors hover:!bg-sky-100 hover:!text-slate-900 data-[highlighted]:!bg-sky-100 data-[highlighted]:!text-slate-900 dark:hover:!bg-sky-900/40 dark:hover:!text-slate-50 dark:data-[highlighted]:!bg-sky-900/40 dark:data-[highlighted]:!text-slate-50'
                                        onSelect={() => {
                                          closeRowContextMenu();
                                          handleAssign(unassignedBooking.id, vehicle.id);
                                        }}
                                      >
                                        {unassignedBooking.humanId &&
                                        unassignedBooking.contactName
                                          ? `${unassignedBooking.humanId} | ${unassignedBooking.contactName} |
                                           (${unassignedBooking.rentalStart} - ${unassignedBooking.rentalEnd})`
                                          : ''}
                                      </DropdownMenuItem>
                                    ),
                                  )
                                )}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {days.map((day, idx) => {
                          const isServiceDay = Boolean(
                            serviceWindow &&
                            day.date >= serviceWindow.from &&
                            day.date <= serviceWindow.to,
                          );
                          const isBookedDay = bookingsForVehicle.some(
                            (booking) =>
                              idx >= booking.startIndex &&
                              idx < booking.startIndex + booking.span,
                          );
                          return (
                            <div
                              key={idx}
                              className={cn(
                                'border-l border-slate-300 bg-background transition-colors first:border-l-0',
                                idx % 2 === 0 ? 'bg-background' : 'bg-muted/10',
                                isServiceDay && 'bg-slate-300/60',
                                !isBookedDay && 'hover:bg-sky-200/70',
                                isAllowedDrop && 'bg-emerald-100/70',
                                isBlockedDrop && 'bg-rose-100/70',
                              )}
                            />
                          );
                        })}
                        {bookingsForVehicle.map((booking) => {
                          const hasOut = carOutBookingIdSet.has(booking.id);
                          const bookingColor = getBookingIslandColor(
                            booking.deliveryIsland,
                          );
                          const bookingMenuItemStyle = {
                            '--fleet-color': bookingColor,
                          } as CSSProperties;
                          const bookingIslandLabel = getBookingIslandLabel(
                            booking.deliveryIsland,
                          );
                          return (
                            <DropdownMenu
                              key={booking.id}
                              open={contextMenuBookingId === booking.id}
                              onOpenChange={(open) => {
                                if (
                                  !open &&
                                  contextMenuBookingId === booking.id
                                ) {
                                  setContextMenuBookingId(null);
                                  setContextMenuPoint(null);
                                }
                              }}
                            >
                              <DropdownMenuTrigger asChild>
                                <span
                                  aria-hidden='true'
                                  className='pointer-events-none fixed h-1 w-1'
                                  style={{
                                    left: contextMenuPoint?.x ?? 0,
                                    top: contextMenuPoint?.y ?? 0,
                                  }}
                                />
                              </DropdownMenuTrigger>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      'm-1 flex flex-col items-center gap-1 rounded-md px-2 py-1 text-primary-foreground shadow-sm',
                                      hasOut || isPending
                                        ? 'cursor-default'
                                        : 'cursor-grab active:cursor-grabbing',
                                    )}
                                    data-booking-chip='true'
                                    style={{
                                      backgroundColor: bookingColor,
                                      backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${
                                        dayColumnWidth - 1
                                      }px, rgba(255,255,255,0.28) ${
                                        dayColumnWidth - 1
                                      }px, rgba(255,255,255,0.28) ${dayColumnWidth}px)`,
                                      boxShadow:
                                        'inset 0 0 0 1px rgba(15,23,42,0.2)',
                                      gridColumn: `${
                                        booking.startIndex + 1
                                      } / span ${booking.span}`,
                                      gridRow: '1',
                                    }}
                                    draggable={!isPending && !hasOut}
                                    onContextMenu={(event) => {
                                      event.preventDefault();
                                      setContextMenuPoint({
                                        x: event.clientX,
                                        y: event.clientY,
                                      });
                                      setContextMenuBookingId(booking.id);
                                    }}
                                    onClick={(event) => {
                                      setContextMenuPoint({
                                        x: event.clientX,
                                        y: event.clientY,
                                      });
                                      setContextMenuBookingId(booking.id);
                                    }}
                                    onDragStart={(event) => {
                                      if (hasOut) {
                                        event.preventDefault();
                                        return;
                                      }
                                      const payload = buildDragPayload(
                                        booking,
                                        vehicle.id,
                                      );
                                      if (!payload) {
                                        event.preventDefault();
                                        return;
                                      }
                                      const target =
                                        event.target as HTMLElement;
                                      if (
                                        target?.closest(
                                          'select,button,input,textarea',
                                        )
                                      ) {
                                        event.preventDefault();
                                        return;
                                      }
                                      event.dataTransfer.effectAllowed = 'move';
                                      event.dataTransfer.setData(
                                        'application/json',
                                        JSON.stringify(payload),
                                      );
                                      setActiveDrag(payload);
                                      setHoverVehicleId(null);
                                    }}
                                    onDragEnd={() => {
                                      setActiveDrag(null);
                                      setHoverVehicleId(null);
                                    }}
                                  >
                                    <div className='flex items-center justify-between gap-2 text-xs font-semibold'>
                                      <span className='truncate'>
                                        {booking.contactName || 'Foglalás'}
                                      </span>
                                    </div>
                                    <div className='text-[11px] opacity-90'>
                                      {booking.rentalStart} →{' '}
                                      {booking.rentalEnd}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side='top'
                                  sideOffset={6}
                                  className='min-w-64 space-y-1 text-xs'
                                >
                                  <div>
                                    <strong>Foglalás:</strong>{' '}
                                    {booking.humanId ?? booking.id}
                                  </div>
                                  <div>
                                    <strong>Név:</strong>{' '}
                                    {booking.contactName || '—'}
                                  </div>
                                  <div>
                                    <strong>Időszak:</strong>{' '}
                                    {booking.rentalStart ?? '—'} →{' '}
                                    {booking.rentalEnd ?? '—'}
                                  </div>
                                  <div>
                                    <strong>Státusz:</strong>{' '}
                                    {getStatusMeta(booking.status).label}
                                  </div>
                                  <div>
                                    <strong>Autó:</strong> {vehicle.plate} -{' '}
                                    {vehicle.carLabel}
                                  </div>
                                  <div>
                                    <strong>Átvétel helye:</strong>{' '}
                                    {booking.deliveryLocation?.trim() || '—'}
                                  </div>
                                  <div>
                                    <strong>Sziget:</strong>{' '}
                                    {bookingIslandLabel}
                                  </div>
                                  <div>
                                    <strong>Bérleti díj:</strong>{' '}
                                    {formatFeeWithEuro(
                                      booking.pricing?.rentalFee,
                                    )}
                                  </div>
                                  <div>
                                    <strong>Kiszállási díj:</strong>{' '}
                                    {formatFeeWithEuro(
                                      booking.pricing?.deliveryFee,
                                    )}
                                  </div>
                                  <div>
                                    <strong>Biztosítási díj:</strong>{' '}
                                    {formatFeeWithEuro(
                                      booking.pricing?.insurance,
                                    )}
                                  </div>
                                  <div>
                                    <strong>Kaució:</strong>{' '}
                                    {formatFeeWithEuro(
                                      booking.pricing?.deposit,
                                    )}
                                  </div>
                                  <div>
                                    <strong>Extrák díja:</strong>{' '}
                                    {formatFeeWithEuro(
                                      booking.pricing?.extrasFee,
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                              <DropdownMenuContent align='start'>
                                {/* <DropdownMenuItem
                                  className='data-[highlighted]:bg-(--fleet-color) data-[highlighted]:text-primary-foreground'
                                  style={menuItemStyle}
                                >
                                  Foglálás áthelyezése másik autóra
                                </DropdownMenuItem> */}
                                <DropdownMenuItem
                                  className='data-[highlighted]:bg-(--fleet-color) data-[highlighted]:text-primary-foreground'
                                  style={bookingMenuItemStyle}
                                  onSelect={() =>
                                    router.push(`/bookings/${booking.id}/edit`)
                                  }
                                >
                                  Megnyitás / Módosítás
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className='data-[highlighted]:bg-(--fleet-color) data-[highlighted]:text-primary-foreground'
                                  style={bookingMenuItemStyle}
                                  onSelect={() =>
                                    router.push(
                                      `/bookings/${booking.id}/carout`,
                                    )
                                  }
                                >
                                  Kiadás
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className='data-[highlighted]:bg-(--fleet-color) data-[highlighted]:text-primary-foreground'
                                  style={bookingMenuItemStyle}
                                  onSelect={() =>
                                    router.push(`/bookings/${booking.id}/carin`)
                                  }
                                  disabled={!hasOut}
                                >
                                  Visszavétel
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          );
                        })}
                      </div>
                      {showDateRow && (
                        <div
                          className='grid h-11 border-b border-slate-300 bg-muted/20 text-xs font-semibold uppercase text-muted-foreground'
                          style={{ gridTemplateColumns: dayGridTemplate }}
                        >
                          {days.map((day, idx) => (
                            <div
                              key={idx}
                              className='flex items-center justify-center border-l border-slate-300 px-2 text-center first:border-l-0'
                            >
                              {day.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className='space-y-4 rounded-xl border bg-card/40 p-4 shadow-sm'
        onDragOver={(event) => {
          if (activeDrag) {
            event.preventDefault();
            if (hoverVehicleId) setHoverVehicleId(null);
          }
        }}
        onDrop={handleDropToUnassigned}
      >
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>
            Hozzárendelésre váró foglalások
          </h3>
          <span className='text-sm text-muted-foreground'>
            {unassignedBookings.length} tétel
          </span>
        </div>
        <div className='grid gap-3 md:grid-cols-2'>
          {unassignedBookings.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              Minden foglalásnál meg van adva flotta autó.
            </p>
          )}
          {unassignedBookings.map((booking) => (
            <UnassignedBookingCard
              key={booking.id}
              booking={booking}
              fleetVehicles={getAvailableFleetVehicles(
                booking.id,
                booking.rentalStart,
                booking.rentalEnd,
              )}
              disabled={isPending}
              onAssign={(bookingId, vehicleId) =>
                handleAssign(bookingId, vehicleId)
              }
              onDragStart={(event, dragBooking) => {
                const payload = buildDragPayload(dragBooking);
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
                event.dataTransfer.setData(
                  'application/json',
                  JSON.stringify(payload),
                );
                setActiveDrag(payload);
              }}
              onDragEnd={() => {
                setActiveDrag(null);
                setHoverVehicleId(null);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
