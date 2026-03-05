import { capitalizeSlug } from '../capitalize-slug';

export const formatPlaceType = (value?: string | null) => {
  if (!value) return '—';
  const map: Record<string, string> = {
    airport: 'Átvétel a reptéren',
    accommodation: 'Átvétel a szállodánál',
    office: 'Átvétel az irodánál',
  };
  return map[value] ?? capitalizeSlug(value);
};
