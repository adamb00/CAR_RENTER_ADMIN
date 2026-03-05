import { capitalizeSlug } from '../capitalize-slug';

export const formatDocumentType = (value?: string | null) => {
  if (!value) return '—';
  const map: Record<string, string> = {
    passport: 'Útlevél',
    id_card: 'Személyi igazolvány',
  };
  return map[value] ?? capitalizeSlug(value);
};
