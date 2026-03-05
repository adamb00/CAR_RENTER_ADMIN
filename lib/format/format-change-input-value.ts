export const formatChangeField = (value?: string) => {
  if (!value) return 'Ismeretlen mező';
  return value
    .split('.')
    .map((segment) => segment.replace(/\[\d+\]/g, '').trim())
    .filter(Boolean)
    .join(' › ');
};

export const formatChangeValueDisplay = (value?: string) => {
  if (!value || value.trim().length === 0) return '—';
  return value;
};
