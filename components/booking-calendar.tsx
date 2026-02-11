'use client';

import { useMemo, useState, useTransition } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { useRouter } from 'next/navigation';

import { assignFleetVehicleToBookingAction } from '@/actions/assignFleetVehicleToBookingAction';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type BookingCalendarBooking = {
  id: string;
  humanId?: string | null;
  contactName: string;
  rentalStart?: string;
  rentalEnd?: string;
  status?: string | null;
  assignedFleetVehicleId?: string;
  carLabel?: string | null;
};

type BookingCalendarVehicle = {
  id: string;
  plate: string;
  status: string;
  carLabel: string;
  carId: string;
  location: string;
};

type BookingCalendarProps = {
  bookings: BookingCalendarBooking[];
  fleetVehicles: BookingCalendarVehicle[];
};

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
        {booking.contactName + ' - ' + booking.carLabel}
      </div>
      <div className='text-sm text-muted-foreground'>
        {booking.rentalStart} → {booking.rentalEnd}
      </div>

      <div className='space-y-1'>
        <label className='text-xs uppercase tracking-wide text-muted-foreground'>
          Flotta autó
        </label>
        <select
          className='w-full rounded border px-3 py-2 text-sm'
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          disabled={disabled}
        >
          <option value=''>Válassz autót</option>
          {fleetVehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.plate} – {vehicle.carLabel}
            </option>
          ))}
        </select>
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

const getLocationColor = (location?: string | null) => {
  if (!location) return '#888888';
  const match = location.match(/#(?:[0-9a-fA-F]{3}){1,2}$/);
  return match?.[0] ?? '#888888';
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
  const [contextMenuBookingId, setContextMenuBookingId] = useState<
    string | null
  >(null);
  const [contextMenuPoint, setContextMenuPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

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
    const map = new Map<string, VisibleBooking>();
    bookings.forEach((booking) => {
      const vehicleId = booking.assignedFleetVehicleId;
      if (!vehicleId) return;
      const clamped = clampBookingToRange(
        booking,
        parsedRangeStart,
        parsedRangeEnd,
      );
      if (!clamped) return;

      const existing = map.get(vehicleId);
      if (!existing || clamped.startIndex < existing.startIndex) {
        map.set(vehicleId, clamped);
      }
    });
    return map;
  }, [bookings, parsedRangeStart, parsedRangeEnd]);

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

  const getAvailableFleetVehicles = (
    bookingId: string,
    rentalStart?: string,
    rentalEnd?: string,
  ) => {
    if (!rentalStart || !rentalEnd) return fleetVehicles;
    return fleetVehicles.filter((vehicle) => {
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

  const timelineTemplate = `220px repeat(${days.length}, 140px)`;

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
        <div className='overflow-x-auto rounded-lg border w-full max-w-full h-full min-w-0'>
          <div
            className='grid border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground'
            style={{ gridTemplateColumns: timelineTemplate }}
          >
            <div className='sticky left-0 z-10 bg-muted/40 px-3 py-2'>Autó</div>
            {days.map((day, idx) => (
              <div key={idx} className='border-l px-2 py-2 text-center'>
                {day.label}
              </div>
            ))}
          </div>

          {fleetVehicles.map((vehicle) => {
            const booking = groupedBookings.get(vehicle.id);
            const locationColor = getLocationColor(vehicle.location);
            const menuItemStyle = {
              '--fleet-color': locationColor,
            } as CSSProperties;
            const dropState =
              activeDrag && hoverVehicleId === vehicle.id
                ? isVehicleAvailable(activeDrag, vehicle.id)
                  ? 'allowed'
                  : 'blocked'
                : null;
            const isAllowedDrop = dropState === 'allowed';
            const isBlockedDrop = dropState === 'blocked';
            return (
              <div
                key={vehicle.id}
                className={cn(
                  'grid items-stretch border-b text-sm transition-colors',
                  isAllowedDrop && 'bg-emerald-100/70',
                  isBlockedDrop && 'bg-rose-100/70',
                )}
                style={{
                  gridTemplateColumns: timelineTemplate,
                  gridRow: '1fr',
                }}
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
                    event.dataTransfer.dropEffect = isAllowed ? 'move' : 'none';
                    if (hoverVehicleId !== vehicle.id) {
                      setHoverVehicleId(vehicle.id);
                    }
                  }
                }}
                onDragLeave={(event) => {
                  const nextTarget = event.relatedTarget as Node | null;
                  if (nextTarget && event.currentTarget.contains(nextTarget))
                    return;
                  setHoverVehicleId(null);
                }}
                onDrop={(event) => handleDropOnVehicle(event, vehicle.id)}
              >
                <div
                  className={cn(
                    'sticky left-0 z-10 flex items-center gap-3 bg-background px-3 py-3 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] overflow-hidden transition-colors',
                    isAllowedDrop && 'bg-emerald-200/80',
                    isBlockedDrop && 'bg-rose-200/80',
                  )}
                >
                  <div className='font-semibold whitespace-nowrap'>
                    {vehicle.plate}
                  </div>
                  <div className='text-xs text-muted-foreground truncate'>
                    {vehicle.carLabel}
                  </div>
                </div>
                {days.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'border-l bg-background/70 transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/10',
                      isAllowedDrop && 'bg-emerald-100/70',
                      isBlockedDrop && 'bg-rose-100/70',
                    )}
                  />
                ))}
                {booking && (
                  <DropdownMenu
                    open={contextMenuBookingId === booking.id}
                    onOpenChange={(open) => {
                      if (!open && contextMenuBookingId === booking.id) {
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
                    <div
                      className='m-1 flex flex-col items-center gap-1 rounded-md px-2 py-1 text-primary-foreground shadow-sm cursor-grab active:cursor-grabbing'
                      style={{
                        backgroundColor: locationColor,
                        gridColumn: `${booking.startIndex + 2} / span ${
                          booking.span
                        }`,
                        gridRow: '1',
                      }}
                      draggable={!isPending}
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
                        const payload = buildDragPayload(booking, vehicle.id);
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
                        {booking.rentalStart} → {booking.rentalEnd}
                      </div>
                    </div>
                    <DropdownMenuContent align='start'>
                      <DropdownMenuItem
                        className='data-[highlighted]:bg-[var(--fleet-color)] data-[highlighted]:text-primary-foreground'
                        style={menuItemStyle}
                        onSelect={() =>
                          router.push(`/bookings/${booking.id}/edit`)
                        }
                      >
                        Megnyitás / Módosítás
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className='data-[highlighted]:bg-[var(--fleet-color)] data-[highlighted]:text-primary-foreground'
                        style={menuItemStyle}
                        onSelect={() =>
                          router.push(`/bookings/${booking.id}/carout`)
                        }
                      >
                        Kiadás
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className='data-[highlighted]:bg-[var(--fleet-color)] data-[highlighted]:text-primary-foreground'
                        style={menuItemStyle}
                        onSelect={() =>
                          router.push(`/bookings/${booking.id}/carin`)
                        }
                      >
                        Visszavétel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
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
