export const CAR_CATEGORIES = ['small', 'medium', 'large', 'suv'] as const;
export const CAR_TRANSMISSIONS = ['manual', 'automatic'] as const;
export const CAR_FUELS = ['petrol', 'diesel', 'electric', 'hybrid'] as const;
export const CAR_STATUSES = ['available', 'rented', 'maintenance', 'inactive', 'reserved'] as const;
export const CAR_BODY_TYPES = ['sedan', 'hatchback', 'suv', 'wagon', 'van', 'pickup', 'coupe'] as const;
export const CAR_TIRE_TYPES = ['summer', 'winter', 'all_season'] as const;
export const CAR_COLORS = ['milky_beige', 'white', 'silver_metal', 'blue', 'metal_blue', 'gray'] as const;

export type CarCategoryOption = (typeof CAR_CATEGORIES)[number];
export type CarTransmissionOption = (typeof CAR_TRANSMISSIONS)[number];
export type CarFuelOption = (typeof CAR_FUELS)[number];
export type CarStatusOption = (typeof CAR_STATUSES)[number];
export type CarBodyTypeOption = (typeof CAR_BODY_TYPES)[number];
export type CarTireTypeOption = (typeof CAR_TIRE_TYPES)[number];
export type CarColorOption = (typeof CAR_COLORS)[number];

export const CAR_CATEGORY_LABELS: Record<CarCategoryOption, string> = {
  small: 'Kis méret',
  medium: 'Közepes méret',
  large: 'Nagy méret',
  suv: 'SUV',
};

export const CAR_TRANSMISSION_LABELS: Record<CarTransmissionOption, string> = {
  manual: 'Manuális',
  automatic: 'Automata',
};

export const CAR_FUEL_LABELS: Record<CarFuelOption, string> = {
  petrol: 'Benzin',
  diesel: 'Dízel',
  electric: 'Elektromos',
  hybrid: 'Hibrid',
};

export const CAR_STATUS_LABELS: Record<CarStatusOption, string> = {
  available: 'Elérhető',
  rented: 'Bérbe adva',
  maintenance: 'Szervizben',
  inactive: 'Inaktív',
  reserved: 'Foglalás alatt',
};

export const CAR_BODY_TYPE_LABELS: Record<CarBodyTypeOption, string> = {
  sedan: 'Sedan',
  hatchback: 'Ferdehátú',
  suv: 'SUV',
  wagon: 'Kombi',
  van: 'Kisbusz',
  pickup: 'Pickup',
  coupe: 'Kupé',
};

export const CAR_TIRE_TYPE_LABELS: Record<CarTireTypeOption, string> = {
  summer: 'Nyári',
  winter: 'Téli',
  all_season: 'Négyévszakos',
};

export const CAR_COLOR_LABELS: Record<CarColorOption, string> = {
  milky_beige: 'Milky beige',
  white: 'Fehér',
  silver_metal: 'Ezüstmetál',
  blue: 'Kék',
  metal_blue: 'Metál kék',
  gray: 'Szürke',
};
