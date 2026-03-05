import { AnalitycsMonthData } from '@/lib/analitycs-db';
import { PALETTE } from '@/lib/constants';
import { formatMoney, numberFormatter } from '@/lib/format/format-number';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import EmptyChart from './empty-chart';

export default function RevenueTrendLine({
  monthData,
}: {
  monthData: AnalitycsMonthData;
}) {
  const points = monthData.rows.slice(-20).map((row) => ({
    code: row.bookingCode,
    revenue: Number(row.revenue.toFixed(2)),
    rentalStart: row.rentalStart,
  }));
  if (points.length === 0) {
    return <EmptyChart message='Nincs elérhető adat a vonaldiagramhoz.' />;
  }

  return (
    <div className='h-80'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart
          data={points}
          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray='3 3' vertical={false} />
          <XAxis
            dataKey='code'
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-20}
            textAnchor='end'
            height={56}
          />
          <YAxis
            tickFormatter={(value: number) => numberFormatter.format(value)}
            width={70}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;

              return (
                <div className='rounded-md border bg-background px-3 py-2 text-xs shadow-sm'>
                  <p>Foglalás: {label}</p>
                  <p>
                    Dátum: {String(payload[0]?.payload?.rentalStart ?? '-')}
                  </p>
                  <p>Bevétel: {formatMoney(Number(payload[0]?.value ?? 0))}</p>
                </div>
              );
            }}
          />
          <Legend />
          <Line
            type='monotone'
            dataKey='revenue'
            name='Bevétel'
            stroke={PALETTE[2]}
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
