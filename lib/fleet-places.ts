const DEFAULT_FLEET_PLACE = 'Alapértelmezett';

const FLEET_PLACES = [
  {
    label: DEFAULT_FLEET_PLACE,
    color: '#1f2937',
    value: `${DEFAULT_FLEET_PLACE} #1f2937`,
  },
  {
    label: 'Lanzarotte I. csoport',
    color: '#0000ff',
    value: 'Lanzarotte I. csoport #0000ff',
  },
  {
    label: 'Fuerteventure Reptér II. csoport',
    color: '#ffa500',
    value: 'Fuerteventure Reptér II. csoport #ffa500',
  },
  {
    label: 'Fuerteventure Szállodák Észak II. csoport',
    color: '#0f766e',
    value: 'Fuerteventure Szállodák Észak II. csoport #0f766e',
  },
  {
    label: 'Fuerteventure Szállodák Dél II. Csoport',
    color: '#2563eb',
    value: 'Fuerteventure Szállodák Dél II. Csoport #2563eb',
  },
  {
    label: 'Fuerteventure Szállodák Közép II. csoport',
    color: '#7c2d12',
    value: 'Fuerteventure Szállodák Közép II. csoport #7c2d12',
  },
] as const;

type FleetPlaceLabel = (typeof FLEET_PLACES)[number]['label'];

const colorSuffixRegex = /\s+#(?:[0-9a-fA-F]{3}){1,2}$/;

const getFleetPlaceLabel = (input?: string | null): string => {
  if (!input) return DEFAULT_FLEET_PLACE;
  const fromValue = FLEET_PLACES.find((place) => place.value === input)?.label;
  if (fromValue) return fromValue;
  return input.replace(colorSuffixRegex, '');
};

const getFleetPlaceValue = (input?: string | null): string => {
  if (!input) return `${DEFAULT_FLEET_PLACE} #ffffff`;
  if (colorSuffixRegex.test(input)) return input;
  const fromLabel = FLEET_PLACES.find((place) => place.label === input)?.value;
  return fromLabel ?? input;
};

export {
  DEFAULT_FLEET_PLACE,
  FLEET_PLACES,
  getFleetPlaceLabel,
  getFleetPlaceValue,
  type FleetPlaceLabel,
};
