import { getCurrentMonthAnalitycs } from '@/lib/analitycs-db';
import {
  formatMoney,
  formatNumber,
  percentFormatter,
} from '@/lib/format/format-number';

export const getSummaryRows = (
  monthData: Awaited<ReturnType<typeof getCurrentMonthAnalitycs>>,
) => [
  {
    label: 'Bérleti díj',
    value: formatMoney(monthData.totals.rentalFee),
    description: 'A kiválasztott hónap pénzügyi bevétele.',
  },
  {
    label: 'Biztosítás',
    value: formatMoney(monthData.totals.insurance),
    description: 'A foglalásoknak a biztosítási díja.',
  },
  {
    label: 'Kiszállítás',
    value: formatMoney(monthData.totals.delivery),
    description: 'A foglalásoknak a kiszállítási díja.',
  },
  {
    label: 'Költségek',
    value: formatMoney(
      monthData.totals.tip +
        monthData.totals.service +
        monthData.totals.fuelCost +
        monthData.totals.ferryCost +
        monthData.totals.cleaningCost +
        monthData.totals.otherCost,
    ),
    description: 'A kiválasztott hónapban rögzített minden költség összege.',
  },
  // {
  //   label: 'Levonás / Jatt',
  //   value: formatMoney(monthData.totals.tip),
  //   description:
  //     'A kiválasztott hónapban rögzített levonás, jatt és jutalék típusok összege.',
  // },
  // {
  //   label: 'Szerviz',
  //   value: formatMoney(monthData.totals.service),
  //   description:
  //     'A flotta autók költséglistájában rögzített szerviz tételek havi összege.',
  // },
  // {
  //   label: 'Tankolás',
  //   value: formatMoney(monthData.totals.fuelCost),
  //   description:
  //     'A kiválasztott hónapban rögzített tankolás költségek összege.',
  // },
  // {
  //   label: 'Komp',
  //   value: formatMoney(monthData.totals.ferryCost),
  //   description: 'A kiválasztott hónapban rögzített komp költségek összege.',
  // },
  // {
  //   label: 'Takarítás',
  //   value: formatMoney(monthData.totals.cleaningCost),
  //   description:
  //     'A kiválasztott hónapban rögzített takarítás költségek összege.',
  // },
  // {
  //   label: 'Egyéb költség',
  //   value: formatMoney(monthData.totals.otherCost),
  //   description:
  //     'A kiválasztott hónapban rögzített egyedi költségtípusok összege.',
  // },
  {
    label: 'Bevétel',

    value: formatMoney(monthData.totals.revenue),
    description:
      'Képlet: Bevétel = Bérleti díj + Biztosítás + Kiszállítás - ( Levonás + Jatt ).',
  },
  {
    label: 'Effektív napok',
    value: `${formatNumber(monthData.totals.effectiveDays)} nap`,
    description:
      'A kiválasztott hónapra ténylegesen eső bérleti napok összege.',
  },
  {
    label: 'Havi kapacitás',
    value: `${formatNumber(monthData.totals.monthCapacity)} nap`,
    description:
      'Képlet: Flotta autók száma × hónap napjai - (Flotta autók száma × 4).',
  },
  {
    label: 'Kihasználtság',
    value: `${percentFormatter.format(monthData.totals.utilization)} %`,
    description:
      'Képlet: Kihasználtság = Effektív napok / Havi kapacitás × 100.',
  },
  {
    label: 'Ajánlat konverzió',
    value: `${percentFormatter.format(monthData.quoteConversion.conversionRate)} %`,
    description:
      "Képlet: Konvertált ajánlatok / Összes ajánlat × 100. Konvertált = a hónap ajánlataiból 'registered' foglalás lett.",
  },
  {
    label: 'Eredmény',
    value: formatMoney(monthData.totals.result),
    description:
      'Képlet: Eredmény = Bevétel - (Szerviz + Tankolás + Komp + Takarítás + Egyéb költség).',
  },
];
