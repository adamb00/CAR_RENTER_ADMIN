export const CAR_BODY_TYPES = [
  'sedan',
  'hatchback',
  'suv',
  'wagon',
  'van',
  'pickup',
  'coupe',
] as const;
export const CAR_FUELS = ['petrol', 'diesel', 'electric', 'hybrid'] as const;
export const CAR_TRANSMISSIONS = ['manual', 'automatic'] as const;
export const CAR_COLORS = [
  'milky_beige',
  'white',
  'silver_metal',
  'blue',
  'metal_blue',
  'gray',
] as const;

export type CarBodyTypeOption = (typeof CAR_BODY_TYPES)[number];
export type CarFuelOption = (typeof CAR_FUELS)[number];
export type CarTransmissionOption = (typeof CAR_TRANSMISSIONS)[number];
export type CarColorOption = (typeof CAR_COLORS)[number];

export const CAR_BODY_TYPE_LABELS: Record<CarBodyTypeOption, string> = {
  sedan: 'Sedan',
  hatchback: 'Ferdehátú',
  suv: 'SUV',
  wagon: 'Kombi',
  van: 'Kisbusz',
  pickup: 'Pickup',
  coupe: 'Kupé',
};

export const CAR_FUEL_LABELS: Record<CarFuelOption, string> = {
  petrol: 'Benzin',
  diesel: 'Dízel',
  electric: 'Elektromos',
  hybrid: 'Hibrid',
};

export const CAR_TRANSMISSION_LABELS: Record<CarTransmissionOption, string> = {
  manual: 'Manuális',
  automatic: 'Automata',
};

export const CAR_COLOR_LABELS: Record<CarColorOption, string> = {
  milky_beige: 'Milky beige',
  white: 'Fehér',
  silver_metal: 'Ezüstmetál',
  blue: 'Kék',
  metal_blue: 'Metál kék',
  gray: 'Szürke',
};

export const CAR_COLOR_SWATCH: Record<CarColorOption, string> = {
  milky_beige: '#f5efe6',
  white: '#ffffff',
  silver_metal: '#d9dfe5',
  blue: '#2563eb',
  metal_blue: '#1d3b72',
  gray: '#94a3b8',
};
