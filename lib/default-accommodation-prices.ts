type AccommodationDailyPrice = {
  days: number;
  priceEur: number;
  fullInsuranceEur: number;
};

type AccommodationDailyPriceByModel = {
  model: string;
  prices: AccommodationDailyPrice[];
};

const ACCOMMODATION_DAILY_PRICES: AccommodationDailyPriceByModel[] = [
  {
    model: 'KIA PICANTO',
    prices: [
      { days: 1, priceEur: 59, fullInsuranceEur: 15 },
      { days: 2, priceEur: 95, fullInsuranceEur: 24 },
      { days: 3, priceEur: 125, fullInsuranceEur: 27 },
      { days: 4, priceEur: 165, fullInsuranceEur: 32 },
      { days: 5, priceEur: 205, fullInsuranceEur: 37 },
      { days: 6, priceEur: 225, fullInsuranceEur: 42 },
      { days: 7, priceEur: 235, fullInsuranceEur: 50 },
    ],
  },
  {
    model: 'KIA STONIC',
    prices: [
      { days: 1, priceEur: 75, fullInsuranceEur: 15 },
      { days: 2, priceEur: 115, fullInsuranceEur: 24 },
      { days: 3, priceEur: 145, fullInsuranceEur: 27 },
      { days: 4, priceEur: 185, fullInsuranceEur: 32 },
      { days: 5, priceEur: 215, fullInsuranceEur: 37 },
      { days: 6, priceEur: 235, fullInsuranceEur: 42 },
      { days: 7, priceEur: 255, fullInsuranceEur: 50 },
    ],
  },
];

const normalizeModel = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

export const findAccommodationDailyPrice = (
  carName: string,
  rentalDays: number,
) => {
  const model = ACCOMMODATION_DAILY_PRICES.find(
    (entry) => normalizeModel(entry.model) === normalizeModel(carName),
  );
  if (!model) return null;
  return model.prices.find((price) => price.days === rentalDays) ?? null;
};

