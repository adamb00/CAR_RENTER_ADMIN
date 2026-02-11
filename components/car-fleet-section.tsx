'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type FleetStatus = 'available' | 'rented' | 'reserved' | 'maintenance';
const STATUS_LABELS: Record<FleetStatus, string> = {
  available: 'Elérhető',
  rented: 'Kikölcsönözve',
  reserved: 'Foglalt',
  maintenance: 'Szerviz',
};

type FleetRow = {
  id: string;
  plate: string;
  odometer: number;
  status: FleetStatus;
  year: string;
  firstRegistration: string;
  location: string;
  vin: string;
  engineNumber: string;
  addedAt: string;
  inspectionExpiry: string;
  notes: string;
  damages: string;
};

type CarFleetSectionProps = {
  carLabel: string;
  carId: string;
  initialRows: FleetRow[];
};

export function CarFleetSection({ carLabel, carId, initialRows }: CarFleetSectionProps) {
  const router = useRouter();
  const rows = initialRows;
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const statusBadgeClass = (status: FleetStatus) =>
    cn(
      'rounded-full px-3 py-1 text-xs font-semibold capitalize',
      status === 'available' && 'bg-emerald-50 text-emerald-700',
      status === 'rented' && 'bg-amber-50 text-amber-700',
      status === 'maintenance' && 'bg-sky-50 text-sky-700',
      status === 'reserved' && 'bg-slate-100 text-slate-700'
    );

  const statusSummary = useMemo(() => {
    const summary = rows.reduce<Record<FleetStatus, number>>(
      (acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }),
      { available: 0, rented: 0, reserved: 0, maintenance: 0 }
    );
    return summary;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        row.plate.toLowerCase().includes(term) ||
        (row.location ?? '').toLowerCase().includes(term) ||
        STATUS_LABELS[row.status].toLowerCase().includes(term)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const visibleRows = filteredRows.slice(startIdx, endIdx);
  const effectiveCurrent = Math.min(currentPage, totalPages);

  const pageInfoLabel =
    filteredRows.length === 0
      ? '0 / 0'
      : `${startIdx + 1}–${Math.min(endIdx, filteredRows.length)} / ${
          filteredRows.length
        }`;
  const goToEdit = (fleetId: string) => {
    router.push(`/cars/${carId}/edit/fleet/${fleetId}`);
  };

  return (
    <section className='space-y-4 rounded-xl border bg-card/40 p-6 shadow-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-lg font-semibold'>
            Flotta – {carLabel || 'autó típus'}
          </h2>
          <p className='text-sm text-muted-foreground'>
            Az adott típusú autók aktuális állapota és adatai.
          </p>
        </div>
        <div className='flex flex-wrap gap-2 text-sm'>
          <span className='rounded-full bg-emerald-50 px-3 py-1 text-emerald-700'>
            Elérhető: {statusSummary['available']}
          </span>
          <span className='rounded-full bg-amber-50 px-3 py-1 text-amber-700'>
            Kikölcsönözve: {statusSummary['rented']}
          </span>
          <span className='rounded-full bg-sky-50 px-3 py-1 text-sky-700'>
            Szerviz: {statusSummary['maintenance']}
          </span>
          <span className='rounded-full bg-slate-100 px-3 py-1 text-slate-700'>
            Foglalt: {statusSummary['reserved']}
          </span>
        </div>
      </div>

      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-wrap items-center gap-3'>
          <Input
            label='Keresés (rendszám, helyszín, státusz)'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='w-72'
          />

          <div className='text-sm text-muted-foreground'>{pageInfoLabel}</div>
        </div>
        <div className='flex justify-end'>
          <Button asChild>
            <Link href={`/cars/${carId}/edit/fleet`}>
              Autó felvétele a flottába
            </Link>
          </Button>
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border'>
        <table className='min-w-full divide-y divide-border text-sm'>
          <thead className='bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground'>
            <tr>
              <th className='px-4 py-3'>Rendszám</th>
              <th className='px-4 py-3'>Km óra</th>
              <th className='px-4 py-3'>Státusz</th>
              <th className='px-4 py-3'>Helyszín</th>
              <th className='px-4 py-3'>Évjárat</th>
              <th className='px-4 py-3'>Műszaki lejár</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border bg-background'>
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                className='hover:bg-muted/30 cursor-pointer'
                role='button'
                tabIndex={0}
                onClick={() => goToEdit(row.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    goToEdit(row.id);
                  }
                }}
              >
                <td className='whitespace-nowrap px-4 py-3 font-semibold'>
                  <Link
                    href={`/cars/${carId}/edit/fleet/${row.id}`}
                    className='text-primary underline-offset-2 hover:underline'
                  >
                    {row.plate}
                  </Link>
                </td>
                <td className='whitespace-nowrap px-4 py-3'>
                  {row.odometer.toLocaleString('hu-HU')} km
                </td>
                <td className='whitespace-nowrap px-4 py-3'>
                  <span className={statusBadgeClass(row.status)}>
                    {STATUS_LABELS[row.status]}
                  </span>
                </td>
                <td className='whitespace-nowrap px-4 py-3'>{row.location}</td>
                <td className='whitespace-nowrap px-4 py-3'>{row.year}</td>
                <td className='whitespace-nowrap px-4 py-3'>
                  {row.inspectionExpiry}
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className='px-4 py-6 text-center text-muted-foreground'
                >
                  Még nincs autó a flottában ehhez a típushoz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={effectiveCurrent === 1}
          >
            Előző
          </Button>
          <span className='text-sm'>
            {effectiveCurrent} / {totalPages}
          </span>
          <Button
            type='button'
            variant='outline'
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={effectiveCurrent === totalPages}
          >
            Következő
          </Button>
        </div>
      </div>
    </section>
  );
}
