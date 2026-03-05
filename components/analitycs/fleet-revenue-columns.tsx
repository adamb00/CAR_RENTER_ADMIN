import { AnalitycsMonthData } from '@/lib/analitycs-db';
import { PALETTE } from '@/lib/constants';
import { numberFormatter } from '@/lib/format/format-number';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import EmptyChart from './empty-chart';
import RevenueTooltip from './revenue-tooltip';

export default function FleetRevenueColumns({
  monthData,
}: {
  monthData: AnalitycsMonthData;
}) {
  const bars = monthData.perCar
    .filter((item) => item.rows > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((item) => ({
      plate: item.plate,
      revenue: Number(item.revenue.toFixed(2)),
      rentalFee: Number(item.rentalFee.toFixed(2)),
      insurance: Number(item.insurance.toFixed(2)),
      delivery: Number(item.delivery.toFixed(2)),
    }));

  if (bars.length === 0) {
    return <EmptyChart message='Nincs elérhető adat az oszlopdiagramhoz.' />;
  }

  return (
    <div className='h-80'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={bars}
          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray='3 3' vertical={false} />
          <XAxis
            dataKey='plate'
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-18}
            textAnchor='end'
            height={52}
          />
          <YAxis
            tickFormatter={(value: number) => numberFormatter.format(value)}
            width={70}
          />
          <Tooltip content={<RevenueTooltip />} />
          <Legend />
          <Bar
            dataKey='revenue'
            name='Bevétel'
            fill={PALETTE[1]}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
