export const DELIVERY_ISLAND_LANZAROTE = 'Lanzarote' as const;
export const DELIVERY_ISLAND_FUERTEVENTURA = 'Fuerteventura' as const;

export type DeliveryIsland =
  | typeof DELIVERY_ISLAND_LANZAROTE
  | typeof DELIVERY_ISLAND_FUERTEVENTURA;

const toSearchable = (...values: Array<string | null | undefined>) =>
  values
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const FLIGHT_CODE_ACE = /(^|[^A-Z])ACE([^A-Z]|$)/;
const FLIGHT_CODE_FUE = /(^|[^A-Z])FUE([^A-Z]|$)/;

const LANZAROTE_KEYWORDS = [
  'lanzarote',
  'arrecife',
  'ace',
  'puerto del carmen',
  'costa teguise',
  'playa blanca',
  'yaiza',
];

const FUERTEVENTURA_KEYWORDS = [
  'fuerteventura',
  'puerto del rosario',
  'corralejo',
  'caleta de fuste',
  'el castillo',
  'jandia',
  'morro jable',
  'costa calma',
  'fue',
];

const includesAny = (source: string, keywords: string[]) =>
  keywords.some((keyword) => source.includes(keyword));

export const resolveDeliveryIsland = ({
  locationName,
  addressLine,
  arrivalFlight,
  departureFlight,
}: {
  locationName?: string | null;
  addressLine?: string | null;
  arrivalFlight?: string | null;
  departureFlight?: string | null;
}): DeliveryIsland | null => {
  const flights = `${arrivalFlight ?? ''} ${departureFlight ?? ''}`.toUpperCase();
  if (FLIGHT_CODE_ACE.test(flights)) {
    return DELIVERY_ISLAND_LANZAROTE;
  }
  if (FLIGHT_CODE_FUE.test(flights)) {
    return DELIVERY_ISLAND_FUERTEVENTURA;
  }

  const searchable = toSearchable(locationName, addressLine);
  if (!searchable) return null;

  if (includesAny(searchable, LANZAROTE_KEYWORDS)) {
    return DELIVERY_ISLAND_LANZAROTE;
  }
  if (includesAny(searchable, FUERTEVENTURA_KEYWORDS)) {
    return DELIVERY_ISLAND_FUERTEVENTURA;
  }

  return null;
};
