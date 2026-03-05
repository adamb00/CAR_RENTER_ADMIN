'use client';

import ArchiveShareChart from '@/components/analitycs/archive-share-chart';
import FleetRevenueColumns from '@/components/analitycs/fleet-revenue-columns';
import OfferConversionChart from '@/components/analitycs/offer-conversion-chart';
import RevenueDonout from '@/components/analitycs/revenue-donout';
import RevenueTrendLine from '@/components/analitycs/revenue-trend-line';
import UtilizationChart from '@/components/analitycs/utilization-chart';
import type { AnalitycsMonthData } from '@/lib/analitycs-db';

export function AnalitycsCharts({
  monthData,
}: {
  monthData: AnalitycsMonthData;
}) {
  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      <div className='rounded-lg border p-4'>
        <h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Kördiagram - Bevétel összetevők
        </h3>
        <RevenueDonout monthData={monthData} />
      </div>

      <div className='rounded-lg border p-4'>
        <h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Oszlopdiagram - Top rendszámok
        </h3>
        <FleetRevenueColumns monthData={monthData} />
      </div>

      <div className='rounded-lg border p-4'>
        <h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Kihasználtság diagram
        </h3>
        <UtilizationChart monthData={monthData} />
      </div>

      <div className='rounded-lg border p-4'>
        <h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Ajánlat - foglalás arány
        </h3>
        <OfferConversionChart monthData={monthData} />
      </div>

      <div className='rounded-lg border p-4'>
        <h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Archivált foglalások aránya
        </h3>
        <ArchiveShareChart monthData={monthData} />
      </div>

      <div className='rounded-lg border p-4 xl:col-span-2'>
        <h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Vonaldiagram - Foglalás bevétel trend
        </h3>
        <RevenueTrendLine monthData={monthData} />
      </div>
    </div>
  );
}
