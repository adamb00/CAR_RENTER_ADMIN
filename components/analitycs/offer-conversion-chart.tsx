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
import EmptyChart from './empty-chart';
import { QuotePart } from './types';
import { formatPercent } from './utils';
import CountTooltip from './count-tooltip';

export default function OfferConversionChart({
  monthData,
}: {
  monthData: AnalitycsMonthData;
}) {
  const {
    totalOffers,
    convertedOffers,
    notConvertedOffers,
    conversionRate,
    registeredBookings,
  } = monthData.quoteConversion;

  if (totalOffers <= 0) {
    return <EmptyChart message='Nincs ajánlat adat a kiválasztott hónapra.' />;
  }

  const quoteParts: QuotePart[] = [
    { label: 'Ajánlatból foglalás', value: convertedOffers },
    { label: 'Még nem foglalás', value: notConvertedOffers },
  ];

  return (
    <div className='space-y-3'>
      <div className='h-60'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={quoteParts}
              dataKey='value'
              nameKey='label'
              cx='50%'
              cy='50%'
              innerRadius={58}
              outerRadius={92}
              paddingAngle={2}
            >
              <Cell fill={PALETTE[0]} />
              <Cell fill={PALETTE[4]} />
            </Pie>
            <Tooltip content={<CountTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className='grid grid-cols-2 gap-2 text-sm'>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Konverzió</p>
          <p className='font-semibold'>{formatPercent(conversionRate)}</p>
        </div>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Összes ajánlat</p>
          <p className='font-semibold'>
            {numberFormatter.format(totalOffers)} db
          </p>
        </div>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Konvertált ajánlat</p>
          <p className='font-semibold'>
            {numberFormatter.format(convertedOffers)} db
          </p>
        </div>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Regisztrált foglalás</p>
          <p className='font-semibold'>
            {numberFormatter.format(registeredBookings)} db
          </p>
        </div>
      </div>
    </div>
  );
}
