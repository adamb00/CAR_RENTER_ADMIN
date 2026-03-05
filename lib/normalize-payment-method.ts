import { capitalizeSlug } from './capitalize-slug';

export const normalizePaymentMethod = (value?: string | null) => {
  if (!value) return '—';
  const map: Record<string, string> = {
    card_on_pickup: 'Átvételkor bankkártya',
    cash_on_pickup: 'Átvételkor készpénz',
    instant_transfer_on_pickup: 'Átvételkor azonnali átutalás',
    advance_transfer: 'Előre utalás',
  };
  return map[value] ?? capitalizeSlug(value);
};
