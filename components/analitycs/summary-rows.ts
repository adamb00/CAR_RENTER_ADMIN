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
    label: 'Átvitt napok',
    value: `${formatNumber(monthData.totals.carriedDays)} nap`,
    description:
      "A foglalás sorok 'Átvitt' oszlopának összege. Az átnyúló hónaprészből származó napokat mutatja.",
  },
  {
    label: 'Bérleti napok',
    value: `${formatNumber(monthData.totals.totalRentalDays)} nap`,
    description:
      "A foglalás sorok 'Nap' oszlopának összege. Soronként: Nap = Aktuális + Átvitt.",
  },
  {
    label: 'Bérleti díj',
    value: formatMoney(monthData.totals.rentalFee),
    description:
      'A foglalások bérleti díjainak összege (rentalFee), elsősorban a foglalás pricing adataiból.',
  },
  {
    label: 'Biztosítás',
    value: formatMoney(monthData.totals.insurance),
    description:
      'A biztosítási díjak összege a foglalások alapján (pricing/ajánlat adatokból).',
  },
  {
    label: 'Kiszállítás',
    value: formatMoney(monthData.totals.delivery),
    description:
      'A kiszállítási díjak összege a foglalások pricing vagy ajánlat adataiból.',
  },
  {
    label: 'Levonás / Jatt',
    value: formatMoney(monthData.totals.tip),
    description:
      'Levonásként kezelt tétel: kiadáskor rögzített jatt (handoverTip), vagy tip/discount mezők összege.',
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
      'Kiadás és visszavétel során rögzített tankolás költségek összege (handoverCosts.out/in.fuelCost).',
  },
  {
    label: 'Komp',
    value: formatMoney(monthData.totals.ferryCost),
    description:
      'Kiadás és visszavétel során rögzített komp költségek összege (handoverCosts.out/in.ferryCost).',
  },
  {
    label: 'Takarítás',
    value: formatMoney(monthData.totals.cleaningCost),
    description:
      'Kiadás és visszavétel során rögzített takarítás költségek összege (handoverCosts.out/in.cleaningCost).',
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
      'Jelenleg a bérleti napokkal azonos mutató, a teljes kihasznált napmennyiséget jelzi.',
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
