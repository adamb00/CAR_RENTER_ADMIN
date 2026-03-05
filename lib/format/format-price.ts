export const formatPriceValue = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? `${trimmed} €` : '—';
};
