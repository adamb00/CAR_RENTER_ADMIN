export const capitalizeSlug = (value?: string | null) => {
  if (!value) return '—';
  return value
    .split('_')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');
};
