export const formatExtras = (extras?: string[]) => {
  if (!extras || extras.length === 0) return '—';
  return extras.join(', ');
};
