export const formatDateShort = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

export const formatDateTimeDetail = (value?: string | null) => {
  if (!value) return 'Ismeretlen időpont';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
