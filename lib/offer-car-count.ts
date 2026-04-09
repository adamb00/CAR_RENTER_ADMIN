const toPositiveInteger = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export const resolveOfferCarsCount = (
  value: unknown,
  fallback?: unknown,
): number | null => {
  return toPositiveInteger(value) ?? toPositiveInteger(fallback);
};

export const formatAdminOfferCarsScope = (count: number) =>
  `A feltüntetett ár ${count} autóra vonatkozik.`;
