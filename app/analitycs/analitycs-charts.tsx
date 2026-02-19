'use client';

import type { AnalitycsMonthData } from '@/lib/analitycs-db';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const numberFormatter = new Intl.NumberFormat('hu-HU', {
  maximumFractionDigits: 2,
});

const formatMoney = (value: number) => `${numberFormatter.format(value)} EUR`;
const formatPercent = (value: number) => `${numberFormatter.format(value)}%`;

const PALETTE = ['#2563eb', '#0ea5e9', '#14b8a6', '#f97316', '#ef4444'];

type RevenuePart = {
  label: string;
  value: number;
};

type QuotePart = {
  label: string;
  value: number;
};

function EmptyChart({ message }: { message: string }) {
  return (
    <div className='flex h-[280px] items-center justify-center rounded-lg border border-dashed px-4 text-sm text-muted-foreground'>
      {message}
    </div>
  );
}

function RevenueTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number }> }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className='rounded-md border bg-background px-3 py-2 text-xs shadow-sm'>
      {payload.map((item) => (
        <p key={item.name}>
          {item.name}: {formatMoney(item.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

function CountTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className='rounded-md border bg-background px-3 py-2 text-xs shadow-sm'>
      {payload.map((item) => (
        <p key={item.name}>
          {item.name}: {numberFormatter.format(item.value ?? 0)} db
        </p>
      ))}
    </div>
  );
}

const RevenueDonut = ({ monthData }: { monthData: AnalitycsMonthData }) => {
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
    <div className='h-[320px]'>
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
};

const FleetRevenueColumns = ({ monthData }: { monthData: AnalitycsMonthData }) => {
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
    <div className='h-[320px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={bars} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} />
          <XAxis dataKey='plate' tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor='end' height={52} />
          <YAxis tickFormatter={(value: number) => numberFormatter.format(value)} width={70} />
          <Tooltip content={<RevenueTooltip />} />
          <Legend />
          <Bar dataKey='revenue' name='Bevétel' fill={PALETTE[1]} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const RevenueTrendLine = ({ monthData }: { monthData: AnalitycsMonthData }) => {
  const points = monthData.rows.slice(-20).map((row) => ({
    code: row.bookingCode,
    revenue: Number(row.revenue.toFixed(2)),
    rentalStart: row.rentalStart,
  }));

  if (points.length === 0) {
    return <EmptyChart message='Nincs elérhető adat a vonaldiagramhoz.' />;
  }

  return (
    <div className='h-[320px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} />
          <XAxis
            dataKey='code'
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-20}
            textAnchor='end'
            height={56}
          />
          <YAxis tickFormatter={(value: number) => numberFormatter.format(value)} width={70} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;

              return (
                <div className='rounded-md border bg-background px-3 py-2 text-xs shadow-sm'>
                  <p>Foglalás: {label}</p>
                  <p>Dátum: {String(payload[0]?.payload?.rentalStart ?? '-')}</p>
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
};

const UtilizationChart = ({ monthData }: { monthData: AnalitycsMonthData }) => {
  const utilizationRaw = monthData.totals.utilization;
  const utilizationCapped = Math.max(0, Math.min(100, utilizationRaw));
  const freeCapacity = Math.max(
    0,
    monthData.totals.monthCapacity - monthData.totals.effectiveDays,
  );
  const radialData = [{ name: 'Kihasználtság', value: utilizationCapped }];

  return (
    <div className='space-y-3'>
      <div className='relative h-[240px]'>
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
          <p className='text-3xl font-semibold'>{formatPercent(utilizationRaw)}</p>
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
          <p className='font-semibold'>{numberFormatter.format(freeCapacity)} nap</p>
        </div>
      </div>
    </div>
  );
};

const OfferConversionChart = ({ monthData }: { monthData: AnalitycsMonthData }) => {
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
      <div className='h-[240px]'>
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
          <p className='font-semibold'>{numberFormatter.format(totalOffers)} db</p>
        </div>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Konvertált ajánlat</p>
          <p className='font-semibold'>
            {numberFormatter.format(convertedOffers)} db
          </p>
        </div>
        <div className='rounded-md border px-3 py-2'>
          <p className='text-xs text-muted-foreground'>Registered foglalás</p>
          <p className='font-semibold'>
            {numberFormatter.format(registeredBookings)} db
          </p>
        </div>
      </div>
    </div>
  );
};

export function AnalitycsCharts({ monthData }: { monthData: AnalitycsMonthData }) {
  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      <div className='rounded-lg border p-4'>
        <h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Kördiagram - Bevétel összetevők
        </h3>
        <RevenueDonut monthData={monthData} />
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

      <div className='rounded-lg border p-4 xl:col-span-2'>
        <h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Vonaldiagram - Foglalás bevétel trend
        </h3>
        <RevenueTrendLine monthData={monthData} />
      </div>
    </div>
  );
}
