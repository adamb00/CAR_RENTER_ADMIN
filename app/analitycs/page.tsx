import { getCurrentMonthAnalitycs } from '@/lib/analitycs-db';
import {
  formatDailyFee,
  formatMoney,
  formatNumber,
  percentFormatter,
} from '@/lib/format/format-number';
import { getStatusMeta } from '@/lib/status';
import { AnalitycsCharts } from './analitycs-charts';
import { MonthPicker } from './month-picker';
import { SummaryTooltipLabel } from './summary-tooltip-label';
import { getSummaryRows } from '@/components/analitycs/summary-rows';

export const revalidate = 0;
export const runtime = 'nodejs';

type PageSearchParams = Record<string, string | string[] | undefined>;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  let monthData: Awaited<ReturnType<typeof getCurrentMonthAnalitycs>>;

  try {
    const resolvedSearchParams = await searchParams;
    const monthParamRaw = resolvedSearchParams?.month;
    const monthParam = Array.isArray(monthParamRaw)
      ? monthParamRaw[0]
      : monthParamRaw;

    monthData = await getCurrentMonthAnalitycs(monthParam);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ismeretlen hiba';

    return (
      <div className='flex h-full flex-1 flex-col gap-6 p-6'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Statisztikák
          </h1>
          <p className='text-muted-foreground'>
            A statisztika betöltése nem sikerült: {message}
          </p>
        </div>
      </div>
    );
  }

  const summaryRows = getSummaryRows(monthData);

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Statisztikák</h1>
        <p className='text-muted-foreground'>
          Kiválasztott hónap: {monthData.monthLabel} ({monthData.monthStart} -{' '}
          {monthData.monthEnd})
        </p>
      </div>

      <section className='rounded-xl border bg-card p-4 md:p-5'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
          <MonthPicker
            value={monthData.monthKey}
            className='rounded-md border bg-background px-3 py-2 text-sm'
          />
        </div>

        <div className='mb-4 flex flex-wrap gap-2 text-sm'>
          <span className='rounded-md border px-2 py-1'>
            Aktív foglalások: <strong>{monthData.rowCount}</strong>
          </span>
          <span className='rounded-md border px-2 py-1'>
            Archivált foglalások:{' '}
            <strong>{monthData.archiveSummary.archivedCount}</strong>
          </span>
          <span className='rounded-md border px-2 py-1'>
            Flotta: <strong>{formatNumber(monthData.totals.fleetCars)}</strong>
          </span>
          <span className='rounded-md border px-2 py-1'>
            Bevétel: <strong>{formatMoney(monthData.totals.revenue)}</strong>
          </span>
          <span className='rounded-md border px-2 py-1'>
            Kihasználtság:{' '}
            <strong>
              {percentFormatter.format(monthData.totals.utilization)}%
            </strong>
          </span>
          <span className='rounded-md border px-2 py-1'>
            Ajánlat konverzió:{' '}
            <strong>
              {percentFormatter.format(
                monthData.quoteConversion.conversionRate,
              )}
              %
            </strong>
          </span>
        </div>

        <div className='space-y-5'>
          <AnalitycsCharts monthData={monthData} />

          <div>
            <h2 className='mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
              Havi összesítő
            </h2>
            <div className='overflow-x-auto rounded-lg border'>
              <table className='min-w-full text-sm'>
                <thead className='bg-muted/40 text-left'>
                  <tr>
                    <th className='px-3 py-2 font-medium'>Mutató</th>
                    <th className='px-3 py-2 font-medium text-right'>Érték</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row) => (
                    <tr key={row.label} className='border-t'>
                      <td className='px-3 py-2'>
                        <SummaryTooltipLabel
                          label={row.label}
                          description={row.description}
                        />
                      </td>

                      <td className='px-3 py-2 text-right font-semibold'>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className='mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
              Havi költségbontás
            </h2>
            <div className='overflow-x-auto rounded-lg border'>
              <table className='min-w-full text-sm'>
                <thead className='bg-muted/40 text-left'>
                  <tr>
                    <th className='px-3 py-2 font-medium'>Típus</th>
                    <th className='px-3 py-2 font-medium'>Kategória</th>
                    <th className='px-3 py-2 text-right font-medium'>Összeg</th>
                  </tr>
                </thead>
                <tbody>
                  {monthData.totals.costBreakdown.length === 0 ? (
                    <tr>
                      <td
                        className='px-3 py-4 text-muted-foreground'
                        colSpan={3}
                      >
                        Nincs rögzített költség erre a hónapra.
                      </td>
                    </tr>
                  ) : (
                    monthData.totals.costBreakdown.map((item) => (
                      <tr key={`${item.category}:${item.slug}`} className='border-t'>
                        <td className='px-3 py-2 font-medium'>{item.label}</td>
                        <td className='px-3 py-2 text-muted-foreground'>
                          {item.category === 'deduction' ? 'Levonás' : 'Költség'}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatMoney(item.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className='mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
              Autónkénti bontás
            </h2>
            <div className='overflow-x-auto rounded-lg border'>
              <table className='min-w-full text-sm'>
                <thead className='bg-muted/40 text-left'>
                  <tr>
                    <th className='px-3 py-2 font-medium'>Rendszám</th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Foglalás
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>Nap</th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Aktuális
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>Átvitt</th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Bérleti díj
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Biztosítás
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Kiszállítás
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Levonás
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Bevétel
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthData.perCar.length === 0 ? (
                    <tr>
                      <td
                        className='px-3 py-4 text-muted-foreground'
                        colSpan={10}
                      >
                        Nincs adat erre a hónapra.
                      </td>
                    </tr>
                  ) : (
                    monthData.perCar.map((car) => (
                      <tr key={car.plate} className='border-t'>
                        <td className='px-3 py-2 font-medium'>{car.plate}</td>
                        <td className='px-3 py-2 text-right'>
                          {formatNumber(car.rows)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatNumber(car.rentalDays)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatNumber(car.currentMonthDays)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatNumber(car.carriedDays)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatMoney(car.rentalFee)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatMoney(car.insurance)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatMoney(car.delivery)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatMoney(car.tip)}
                        </td>
                        <td className='px-3 py-2 text-right font-semibold'>
                          {formatMoney(car.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className='mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
              Foglalás szintű részletek
            </h2>
            <div className='w-full max-w-full overflow-x-auto rounded-lg border'>
              <table className='w-full min-w-412.5 text-sm'>
                <thead className='sticky top-0 bg-muted/50 text-left backdrop-blur'>
                  <tr>
                    <th className='px-3 py-2 font-medium'>#</th>
                    <th className='px-3 py-2 font-medium'>Foglalás</th>
                    <th className='px-3 py-2 font-medium'>Rendszám</th>
                    <th className='px-3 py-2 font-medium'>Kezdés</th>
                    <th className='px-3 py-2 font-medium'>Vége</th>
                    <th className='px-3 py-2 font-medium text-right'>Nap</th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Aktuális
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>Átvitt</th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Napi díj
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Bérleti díj
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Biztosítás
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Kiszállítás
                    </th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Levonás
                    </th>
                    <th className='px-3 py-2 font-medium'>Költségek</th>
                    <th className='px-3 py-2 font-medium text-right'>
                      Bevétel
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthData.rows.length === 0 ? (
                    <tr>
                      <td
                        className='px-3 py-4 text-muted-foreground'
                        colSpan={15}
                      >
                        Nincs foglalás az aktuális hónapban.
                      </td>
                    </tr>
                  ) : (
                    monthData.rows.map((row) => (
                      <tr key={row.bookingId} className='border-t align-top'>
                        <td className='px-3 py-2'>{row.rowNumber - 1}</td>
                        <td className='px-3 py-2 font-medium'>
                          {row.bookingCode}
                        </td>
                        <td className='px-3 py-2'>{row.plate}</td>
                        <td className='px-3 py-2'>{row.rentalStart}</td>
                        <td className='px-3 py-2'>{row.rentalEnd}</td>
                        <td className='px-3 py-2 text-right'>
                          {formatNumber(row.fullRentalDays)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatNumber(row.currentMonthDays)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatNumber(row.carriedDays)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatDailyFee(row.dailyFee)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatMoney(row.rentalFee)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatMoney(row.insurance)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatMoney(row.delivery)}
                        </td>
                        <td className='px-3 py-2 text-right'>
                          {formatMoney(row.tip)}
                        </td>
                        <td className='px-3 py-2'>
                          {row.costBreakdown.length === 0 ? (
                            <span className='text-muted-foreground'>-</span>
                          ) : (
                            <div className='space-y-1'>
                              {row.costBreakdown.map((item) => (
                                <div
                                  key={`${row.bookingId}:${item.category}:${item.slug}`}
                                  className='flex items-center justify-between gap-3 whitespace-nowrap'
                                >
                                  <span className='text-muted-foreground'>
                                    {item.label}
                                  </span>
                                  <span>{formatMoney(item.total)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className='px-3 py-2 text-right font-semibold'>
                          {formatMoney(row.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
