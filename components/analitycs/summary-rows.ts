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
    description:
      'A kiválasztott hónap pénzügyi bevétele: normál fizetésnél a hónapban induló foglalások bérleti díja, előre utalásnál a fizetés hónapjához kötve.',
  },
  {
    label: 'Biztosítás',
    value: formatMoney(monthData.totals.insurance),
    description:
      'Csak azoknak a foglalásoknak a biztosítási díja, amelyek pénzügyileg ebbe a hónapba tartoznak.',
  },
  {
    label: 'Kiszállítás',
    value: formatMoney(monthData.totals.delivery),
    description:
      'Csak azoknak a foglalásoknak a kiszállítási díja, amelyek pénzügyileg ebbe a hónapba tartoznak.',
  },
  {
    label: 'Levonás / Jatt',
    value: formatMoney(monthData.totals.tip),
    description:
      'A kiválasztott hónapban rögzített jatt és jutalék összege a BookingHandoverCosts tábla alapján, a /costs oldal havi szűrésével egyezően.',
  },
  {
    label: 'Szerviz',
    value: formatMoney(monthData.totals.service),
    description:
      'A flotta autók költséglistájában rögzített szerviz tételek havi összege (serviceCosts).',
  },
  {
    label: 'Tankolás',
    value: formatMoney(monthData.totals.fuelCost),
    description:
      'A kiválasztott hónapban rögzített tankolás költségek összege a BookingHandoverCosts tábla alapján, a /costs oldal havi szűrésével egyezően.',
  },
  {
    label: 'Komp',
    value: formatMoney(monthData.totals.ferryCost),
    description:
      'A kiválasztott hónapban rögzített komp költségek összege a BookingHandoverCosts tábla alapján, a /costs oldal havi szűrésével egyezően.',
  },
  {
    label: 'Takarítás',
    value: formatMoney(monthData.totals.cleaningCost),
    description:
      'A kiválasztott hónapban rögzített takarítás költségek összege a BookingHandoverCosts tábla alapján, a /costs oldal havi szűrésével egyezően.',
  },
  {
    label: 'Bevétel',

    value: formatMoney(monthData.totals.revenue),
    description:
      'Képlet: Bevétel = Bérleti díj + Biztosítás + Kiszállítás - Levonás / Jatt.',
  },
  {
    label: 'Effektív napok',
    value: `${formatNumber(monthData.totals.effectiveDays)} nap`,
    description:
      "A kiválasztott hónapra ténylegesen eső bérleti napok összege. Az átnyúló foglalások csak itt, a kihasználtság számításában jelennek meg.",
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
      'Képlet: Eredmény = Bevétel - (Szerviz + Tankolás + Komp + Takarítás).',
  },
];
