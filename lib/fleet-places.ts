const DEFAULT_FLEET_PLACE = 'Alapértelmezett';

const FLEET_PLACES = [
  {
    label: DEFAULT_FLEET_PLACE,
    color: '#ffffff',
    value: `${DEFAULT_FLEET_PLACE} #ffffff`,
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
    color: '#008000',
    value: 'Fuerteventure Szállodák Észak II. csoport #008000',
  },
  {
    label: 'Fuerteventure Szállodák Dél II. Csoport',
    color: '#add8e6',
    value: 'Fuerteventure Szállodák Dél II. Csoport #add8e6',
  },
  {
    label: 'Fuerteventure Szállodák Közép II. csoport',
    color: '#ffffff',
    value: 'Fuerteventure Szállodák Közép II. csoport #ffffff',
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
