import { AnalitycsMonthData } from '@/lib/analitycs-db';
import { PALETTE } from '@/lib/constants';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import EmptyChart from './empty-chart';
import RevenueTooltip from './revenue-tooltip';
import { RevenuePart } from './types';

export default function RevenueDonout({
  monthData,
}: {
  monthData: AnalitycsMonthData;
}) {
  const revenueParts: RevenuePart[] = [
    { label: 'Bérleti díj', value: monthData.totals.rentalFee },
    { label: 'Biztosítás', value: monthData.totals.insurance },
    { label: 'Kiszállítás', value: monthData.totals.delivery },
    { label: 'Levonás', value: Math.abs(monthData.totals.tip) },
  ].filter((item) => item.value > 0);

  if (revenueParts.length === 0) {
    return <EmptyChart message='Nincs elérhető adat a kördiagramhoz.' />;
  }

  return (
    <div className='h-80'>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={revenueParts}
            dataKey='value'
            nameKey='label'
            cx='50%'
            cy='50%'
            innerRadius={72}
            outerRadius={108}
            paddingAngle={2}
          >
            {revenueParts.map((item, index) => (
              <Cell key={item.label} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<RevenueTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
