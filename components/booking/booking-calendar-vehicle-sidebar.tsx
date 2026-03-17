'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties, DragEvent } from 'react';

import { cn } from '@/lib/utils';

import type { BookingCalendarVehicle } from './types';
import { getLocationColor, getServiceRemainingKm } from './utils';

type BookingCalendarVehicleSidebarProps = {
  vehicles: BookingCalendarVehicle[];
  firstColumnWidth: number;
  rowStyle: CSSProperties;
  getVehicleDropState: (vehicleId: string) => 'allowed' | 'blocked' | null;
  onVehicleDragEnter: (vehicleId: string) => void;
  onVehicleDragOver: (
    event: DragEvent<HTMLElement>,
    vehicleId: string,
  ) => void;
  onVehicleDragLeave: (event: DragEvent<HTMLElement>) => void;
  onVehicleDrop: (event: DragEvent<HTMLElement>, vehicleId: string) => void;
};

export function BookingCalendarVehicleSidebar({
  vehicles,
  firstColumnWidth,
  rowStyle,
  getVehicleDropState,
  onVehicleDragEnter,
  onVehicleDragOver,
  onVehicleDragLeave,
  onVehicleDrop,
}: BookingCalendarVehicleSidebarProps) {
  return (
    <div
      className='shrink-0 border-r border-slate-300 bg-background'
      style={{ width: firstColumnWidth }}
    >
      <div className='flex h-11 items-center border-b border-slate-300 bg-muted/40 px-3 text-xs font-semibold uppercase text-muted-foreground'>
        Autó
      </div>
      {vehicles.map((vehicle, index) => {
        const remainingServiceKm = getServiceRemainingKm(vehicle);
        const isServiceDueSoon =
          remainingServiceKm != null && remainingServiceKm <= 1000;
        const dropState = getVehicleDropState(vehicle.id);
        const isAllowedDrop = dropState === 'allowed';
        const isBlockedDrop = dropState === 'blocked';
        const locationColor = getLocationColor(vehicle.location);
        const showDateRow =
          (index + 1) % 10 === 0 && index < vehicles.length - 1;

        return (
          <div key={vehicle.id}>
            <div
              className={cn(
                'flex items-center gap-3 border-b border-slate-300 bg-background px-3 transition-colors',
                isAllowedDrop && 'bg-emerald-100/70',
                isBlockedDrop && 'bg-rose-100/70',
              )}
              style={rowStyle}
              onDragEnter={() => onVehicleDragEnter(vehicle.id)}
              onDragOver={(event) => onVehicleDragOver(event, vehicle.id)}
              onDragLeave={onVehicleDragLeave}
              onDrop={(event) => onVehicleDrop(event, vehicle.id)}
            >
              <div className='flex items-center gap-2 font-semibold whitespace-nowrap'>
                {isServiceDueSoon && (
                  <span
                    className='cursor-help text-rose-400'
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
              <div className='truncate text-xs text-muted-foreground'>
                {vehicle.carLabel}
              </div>
              <span
                className='h-2.5 w-2.5 rounded-full border border-black/10'
                style={{ backgroundColor: locationColor ?? '#888888' }}
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
  );
}
