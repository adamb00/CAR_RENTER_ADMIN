import { AnalitycsMonthData } from '@/lib/analitycs-db';
import { PALETTE } from '@/lib/constants';
import { numberFormatter } from '@/lib/format/format-number';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import CountTooltip from './count-tooltip';
import EmptyChart from './empty-chart';
import { ArchivePart } from './types';
import { formatMoney, formatPercent } from './utils';

export default function ArchiveShareChart({
  monthData,
}: {
  monthData: AnalitycsMonthData;
}) {
  const {
    totalBookings,
    activeCount,
    archivedCount,
    activeRevenue,
    archivedRevenue,
    archivedShare,
  } = monthData.archiveSummary;

  if (totalBookings <= 0) {
    return <EmptyChart message='Nincs foglalás adat a kiválasztott hónapra.' />;
  }

  const archiveParts: ArchivePart[] = [
    { label: 'Aktív foglalás', value: activeCount, revenue: activeRevenue },
    {
      label: 'Archivált foglalás',
      value: archivedCount,
      revenue: archivedRevenue,
    },
  ];

  return (
    <div className='space-y-3'>
      <div className='h-60'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={archiveParts}
              dataKey='value'
              nameKey='label'
              cx='50%'
              cy='50%'
              innerRadius={58}
              outerRadius={92}
              paddingAngle={2}
            >
              <Cell fill={PALETTE[0]} />
              <Cell fill={PALETTE[3]} />
            </Pie>
            <Tooltip content={<CountTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className='grid grid-cols-2 gap-2 text-sm'>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Archivált arány</p>
          <p className='font-semibold'>{formatPercent(archivedShare)}</p>
        </div>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Archivált darab</p>
          <p className='font-semibold'>
            {numberFormatter.format(archivedCount)} db
          </p>
        </div>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Aktív bevétel</p>
          <p className='font-semibold'>{formatMoney(activeRevenue)}</p>
        </div>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Archivált bevétel</p>
          <p className='font-semibold'>{formatMoney(archivedRevenue)}</p>
        </div>
      </div>
    </div>
  );
}
