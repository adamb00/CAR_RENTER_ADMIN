export const booleanLabel = (value: boolean | null | undefined) => {
  if (value == null) return '—';
  return value ? 'Igen' : 'Nem';
};
