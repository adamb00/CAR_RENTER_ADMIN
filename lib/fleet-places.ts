const DEFAULT_FLEET_PLACE = 'Alapértelmezett';

const FLEET_PLACES = [
  {
    label: DEFAULT_FLEET_PLACE,
    color: '#1f2937',
    colorName: 'sötétszürke',
    value: `${DEFAULT_FLEET_PLACE} #1f2937`,
  },
  {
    label: 'Lanzarotte I. csoport',
    color: '#0000ff',
    colorName: 'kék',
    value: 'Lanzarotte I. csoport #0000ff',
  },
  {
    label: 'Fuerteventure Reptér II. csoport',
    color: '#ffa500',
    colorName: 'narancs',
    value: 'Fuerteventure Reptér II. csoport #ffa500',
  },
  // {
  //   label: 'Fuerteventure Szállodák Észak II. csoport',
  //   color: '#0f766e',
  //   colorName: 'türkiz',
  //   value: 'Fuerteventure Szállodák Észak II. csoport #0f766e',
  // },
  // {
  //   label: 'Fuerteventure Szállodák Dél II. Csoport',
  //   color: '#2563eb',
  //   colorName: 'világoskék',
  //   value: 'Fuerteventure Szállodák Dél II. Csoport #2563eb',
  // },
  // {
  //   label: 'Fuerteventure Szállodák Közép II. csoport',
  //   color: '#7c2d12',
  //   colorName: 'barna',
  //   value: 'Fuerteventure Szállodák Közép II. csoport #7c2d12',
  // },
] as const;

type FleetPlaceLabel = (typeof FLEET_PLACES)[number]['label'];

const colorSuffixRegex = /\s+#(?:[0-9a-fA-F]{3}){1,2}$/;
const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}$/;

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

const getFleetPlaceColor = (input?: string | null): string => {
  if (!input) return FLEET_PLACES[0].color;
  const fromValue = input.match(colorRegex)?.[0];
  if (fromValue) return fromValue;

  const label = getFleetPlaceLabel(input);
  const fromLabel = FLEET_PLACES.find((place) => place.label === label)?.color;
  return fromLabel ?? FLEET_PLACES[0].color;
};

export {
  DEFAULT_FLEET_PLACE,
  FLEET_PLACES,
  getFleetPlaceLabel,
  getFleetPlaceColor,
  getFleetPlaceValue,
  type FleetPlaceLabel,
};
