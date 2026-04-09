'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/format/format-date';
import { DAY_MS, RENT_STATUS_CANCELLED } from '@/lib/constants';
import { cn } from '@/lib/utils';

import { BookingCalendarBookingChip } from './booking-calendar-booking-chip';
import { BookingCalendarLegend } from './booking-calendar-legend';
import { BookingCalendarVehicleSidebar } from './booking-calendar-vehicle-sidebar';

import { getBookingIslandColor, getLocationColor, toIsoDate } from './utils';
import { BookingCalendarModel } from '@/hooks/use-booking-calendar';

type BookingCalendarTimelineProps = {
  calendar: BookingCalendarModel;
};

export function BookingCalendarTimeline({
  calendar,
}: BookingCalendarTimelineProps) {
  const router = useRouter();
  const todayIso = new Date().toISOString().slice(0, 10);

  const getDayColumnClass = (
    day: BookingCalendarModel['days'][number],
    idx: number,
  ) => {
    const dayOfWeek = day.date.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = day.iso === todayIso;

    if (isToday) return 'bg-slate-500/40';
    if (isWeekend) return 'bg-slate-400/30';
    return idx % 2 === 0 ? 'bg-background' : 'bg-muted/10';
  };

  return (
    <div className='space-y-3 rounded-xl border bg-card/40 p-4 shadow-sm min-w-0'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Flotta idővonal</h2>
        <span className='text-sm text-muted-foreground'>
          {formatDate(toIsoDate(calendar.parsedRangeStart), 'short')} –{' '}
          {formatDate(toIsoDate(calendar.parsedRangeEnd), 'short')}
        </span>
      </div>

      <BookingCalendarLegend items={calendar.locationLegend} />

      <div className='min-w-0 rounded-lg border border-slate-300'>
        <div className='flex min-w-0'>
          <BookingCalendarVehicleSidebar
            vehicles={calendar.sortedFleetVehicles}
            firstColumnWidth={calendar.firstColumnWidth}
            rowStyle={calendar.rowStyle}
            getVehicleDropState={calendar.getVehicleDropState}
            onVehicleDragEnter={calendar.handleVehicleRowDragEnter}
            onVehicleDragOver={calendar.handleVehicleRowDragOver}
            onVehicleDragLeave={calendar.handleVehicleRowDragLeave}
            onVehicleDrop={calendar.handleDropOnVehicle}
          />

          <div
            ref={calendar.timelineViewportRef}
            className='min-w-0 flex-1 overflow-x-auto'
          >
            <div style={{ width: calendar.timelineWidth }}>
              <div
                className='grid h-11 border-b border-slate-300 text-xs font-semibold uppercase text-muted-foreground'
                style={{ gridTemplateColumns: calendar.dayGridTemplate }}
              >
                {calendar.days.map((day, idx) => (
                  <div
                    key={day.iso}
                    className={cn(
                      'flex items-center justify-center border-l border-slate-300 px-2 text-center first:border-l-0',
                      getDayColumnClass(day, idx),
                    )}
                  >
                    {day.label}
                  </div>
                ))}
              </div>

              {calendar.sortedFleetVehicles.map((vehicle, index) => {
                const bookingsForVehicle =
                  calendar.groupedBookings.get(vehicle.id) ?? [];
                const serviceWindow = calendar.serviceWindowByVehicle.get(
                  vehicle.id,
                );
                const firstBookingForVehicle = bookingsForVehicle[0];
                const bookingIslandColor = getBookingIslandColor(
                  firstBookingForVehicle?.deliveryIsland,
                );
                const assignableUnassignedBookings =
                  calendar.getAssignableUnassignedBookings(vehicle.id);
                const activeAssignableUnassignedBookings =
                  assignableUnassignedBookings.filter(
                    (booking) => booking.status !== RENT_STATUS_CANCELLED,
                  );
                const menuItemStyle = {
                  '--fleet-color':
                    bookingIslandColor ?? getLocationColor(vehicle.location),
                } as CSSProperties;
                const dropState = calendar.getVehicleDropState(vehicle.id);
                const isAllowedDrop = dropState === 'allowed';
                const isBlockedDrop = dropState === 'blocked';
                const showDateRow =
                  (index + 1) % 10 === 0 &&
                  index < calendar.sortedFleetVehicles.length - 1;

                return (
                  <div key={vehicle.id}>
                    <div
                      className={cn(
                        'relative grid overflow-hidden border-b border-slate-300 text-sm transition-colors cursor-pointer',
                        isAllowedDrop && 'bg-emerald-100/70',
                        isBlockedDrop && 'bg-rose-100/70',
                      )}
                      style={{
                        ...calendar.rowStyle,
                        gridTemplateColumns: calendar.dayGridTemplate,
                      }}
                      onDragEnter={() =>
                        calendar.handleVehicleRowDragEnter(vehicle.id)
                      }
                      onDragOver={(event) =>
                        calendar.handleVehicleRowDragOver(event, vehicle.id)
                      }
                      onDragLeave={calendar.handleVehicleRowDragLeave}
                      onDrop={(event) =>
                        calendar.handleDropOnVehicle(event, vehicle.id)
                      }
                      onClick={(event) =>
                        calendar.openRowContextMenu(event, vehicle.id)
                      }
                      onContextMenu={(event) =>
                        calendar.openRowContextMenu(event, vehicle.id)
                      }
                    >
                      <DropdownMenu
                        open={calendar.rowContextMenuVehicleId === vehicle.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            calendar.closeRowContextMenu();
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <span
                            aria-hidden='true'
                            className='pointer-events-none fixed h-1 w-1'
                            style={{
                              left: calendar.rowContextMenuPoint?.x ?? 0,
                              top: calendar.rowContextMenuPoint?.y ?? 0,
                            }}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start'>
                          <DropdownMenuItem
                            className='data-highlighted:bg-(--fleet-color) data-highlighted:text-primary-foreground'
                            style={menuItemStyle}
                            onSelect={() => {
                              calendar.closeRowContextMenu();
                              router.push(
                                '/bookings/new?' +
                                  new URLSearchParams({
                                    vehicleId: vehicle.id,
                                    rentalStart:
                                      calendar.rowContextMenuDateIso ??
                                      calendar.days[0]?.iso ??
                                      '',
                                  }).toString(),
                              );
                            }}
                          >
                            Új foglalás hozzáadása
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger
                              className='data-[state=open]:bg-(--fleet-color) data-[state=open]:text-primary-foreground data-highlighted:bg-(--fleet-color) data-highlighted:text-primary-foreground'
                              style={menuItemStyle}
                            >
                              Meglévő foglalás hozzárendelése
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                              className='max-h-80 w-85 overflow-y-auto'
                              sideOffset={4}
                            >
                              {activeAssignableUnassignedBookings.length ===
                              0 ? (
                                <DropdownMenuItem disabled>
                                  Nincs hozzárendelhető foglalás.
                                </DropdownMenuItem>
                              ) : (
                                activeAssignableUnassignedBookings.map(
                                  (unassignedBooking) => (
                                    <DropdownMenuItem
                                      key={unassignedBooking.id}
                                      className='cursor-pointer transition-colors hover:bg-sky-100! hover:text-slate-900! data-highlighted:bg-sky-100! data-highlighted:text-slate-900! dark:hover:bg-sky-900/40! dark:hover:text-slate-50! dark:data-highlighted:bg-sky-900/40! dark:data-highlighted:text-slate-50!'
                                      onSelect={() => {
                                        calendar.closeRowContextMenu();
                                        calendar.handleAssign(
                                          unassignedBooking.bookingId,
                                          unassignedBooking.slotIndex ?? 0,
                                          vehicle.id,
                                        );
                                      }}
                                    >
                                      {unassignedBooking.humanId &&
                                      unassignedBooking.contactName
                                        ? `${unassignedBooking.humanId} | ${unassignedBooking.contactName} | ${(unassignedBooking.slotIndex ?? 0) + 1}/${unassignedBooking.requiredCars ?? 1} | (${unassignedBooking.rentalStart} - ${unassignedBooking.rentalEnd})`
                                        : ''}
                                    </DropdownMenuItem>
                                  ),
                                )
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {calendar.days.map((day, idx) => {
                        const isServiceDay = Boolean(
                          serviceWindow &&
                          day.date >= serviceWindow.from &&
                          day.date <= serviceWindow.to,
                        );
                        const dayStartMs = calendar.rangeStartMs + idx * DAY_MS;
                        const dayEndMs = dayStartMs + DAY_MS;
                        const isBookedDay = bookingsForVehicle.some(
                          (booking) =>
                            booking.clampedStartMs < dayEndMs &&
                            booking.clampedEndMs > dayStartMs,
                        );

                        return (
                          <div
                            key={day.iso}
                            className={cn(
                              'border-l border-slate-300 transition-colors first:border-l-0',
                              getDayColumnClass(day, idx),
                              isServiceDay && 'bg-slate-300/60',
                              isBookedDay
                                ? 'hover:bg-sky-300/70'
                                : 'hover:bg-sky-200/70',
                              isAllowedDrop && 'bg-emerald-100/70',
                              isBlockedDrop && 'bg-rose-100/70',
                            )}
                          />
                        );
                      })}

                      {bookingsForVehicle.map((booking) => (
                        <BookingCalendarBookingChip
                          key={booking.id}
                          booking={booking}
                          vehicle={vehicle}
                          hasOut={calendar.carOutBookingIdSet.has(
                            booking.bookingId,
                          )}
                          isPending={calendar.isPending}
                          dayColumnWidth={calendar.dayColumnWidth}
                          timelineWidth={calendar.timelineWidth}
                          bookingChipStyleBase={calendar.bookingChipStyleBase}
                          contextMenuBookingId={calendar.contextMenuBookingId}
                          contextMenuPoint={calendar.contextMenuPoint}
                          onBookingMenuOpenChange={(bookingId, open) => {
                            if (
                              !open &&
                              calendar.contextMenuBookingId === bookingId
                            ) {
                              calendar.closeBookingContextMenu();
                            }
                          }}
                          onOpenBookingMenu={calendar.openBookingContextMenu}
                          onBookingDragStart={
                            calendar.handleVehicleBookingDragStart
                          }
                          onBookingDragEnd={calendar.handleDragEnd}
                        />
                      ))}
                    </div>

                    {showDateRow && (
                      <div
                        className='grid h-11 border-b border-slate-300 text-xs font-semibold uppercase text-muted-foreground'
                        style={{
                          gridTemplateColumns: calendar.dayGridTemplate,
                        }}
                      >
                        {calendar.days.map((day, idx) => (
                          <div
                            key={`${vehicle.id}-${day.iso}`}
                            className={cn(
                              'flex items-center justify-center border-l border-slate-300 px-2 text-center first:border-l-0',
                              getDayColumnClass(day, idx),
                            )}
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
  );
}
