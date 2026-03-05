import { AnalitycsMonthData } from '@/lib/analitycs-db';
import { PALETTE } from '@/lib/constants';
import { formatPercent, numberFormatter } from '@/lib/format/format-number';
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts';

export default function UtilizationChart({
  monthData,
}: {
  monthData: AnalitycsMonthData;
}) {
  const utilizationRaw = monthData.totals.utilization;
  const utilizationCapped = Math.max(0, Math.min(100, utilizationRaw));
  const freeCapacity = Math.max(
    0,
    monthData.totals.monthCapacity - monthData.totals.effectiveDays,
  );
  const radialData = [{ name: 'Kihasználtság', value: utilizationCapped }];

  return (
    <div className='space-y-3'>
      <div className='relative h-60'>
        <ResponsiveContainer width='100%' height='100%'>
          <RadialBarChart
            data={radialData}
            innerRadius='68%'
            outerRadius='100%'
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type='number' domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey='value'
              cornerRadius={10}
              background={{ fill: 'hsl(var(--muted))' }}
              fill={PALETTE[0]}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>
            Kihasználtság
          </p>
          <p className='text-3xl font-semibold'>
            {formatPercent(utilizationRaw)}
          </p>
          {utilizationRaw > 100 ? (
            <p className='text-xs text-amber-600'>100% feletti terhelés</p>
          ) : null}
        </div>
      </div>

      <div className='grid grid-cols-2 gap-2 text-sm'>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Effektív napok</p>
          <p className='font-semibold'>
            {numberFormatter.format(monthData.totals.effectiveDays)} nap
          </p>
        </div>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Szabad kapacitás</p>
          <p className='font-semibold'>
            {numberFormatter.format(freeCapacity)} nap
          </p>
        </div>
      </div>
    </div>
  );
}
