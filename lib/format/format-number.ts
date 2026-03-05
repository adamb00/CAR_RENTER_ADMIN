export const numberFormatter = new Intl.NumberFormat('hu-HU', {
  maximumFractionDigits: 2,
});

export const percentFormatter = new Intl.NumberFormat('hu-HU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPercent = (value: number) =>
  `${numberFormatter.format(value)}%`;
export const formatNumber = (value: number) => numberFormatter.format(value);
export const formatMoney = (value: number) =>
  `${numberFormatter.format(value)} EUR`;

export const formatDailyFee = (value: number | string) => {
  if (typeof value === 'number') {
    return `${numberFormatter.format(value)} EUR/nap`;
  }

  return value;
};
