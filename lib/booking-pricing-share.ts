type SharedPricing = {
  rentalFee?: string | null;
  insurance?: string | null;
  deposit?: string | null;
  deliveryFee?: string | null;
  extrasFee?: string | null;
  deliveryLocation?: string | null;
  originalRentalFee?: string | null;
  discountedRentalFee?: string | null;
};

const toTrimmedValue = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const parseAmount = (value?: string | null) => {
  const text = toTrimmedValue(value);
  if (!text) return 0;
  const raw = text.replace(/[^\d,.-]/g, '');
  if (!raw) return 0;

  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');
  const decimalSeparator =
    lastComma > lastDot ? ',' : lastDot > lastComma ? '.' : '';

  let normalized = raw;
  if (decimalSeparator) {
    const parts = raw.split(decimalSeparator);
    const decimal = parts.pop() ?? '';
    const integer = parts.join('').replace(/[.,]/g, '');
    normalized = `${integer}.${decimal}`;
  } else {
    normalized = raw.replace(/[.,]/g, '');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatAmount = (value: number) => {
  if (!Number.isFinite(value)) return undefined;
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

export const getRequiredCarsCount = (value?: number | null) =>
  Math.max(1, Math.floor(value ?? 1));

export const splitPricingByCars = <T extends SharedPricing>(
  pricing: T | null | undefined,
  requiredCars?: number | null,
) => {
  if (!pricing) return pricing;

  const divisor = getRequiredCarsCount(requiredCars);
  const hasInsurance = parseAmount(pricing.insurance) > 0;
  const splitValue = (value?: string | null) => {
    const trimmed = toTrimmedValue(value);
    if (!trimmed) return undefined;
    return formatAmount(parseAmount(trimmed) / divisor);
  };

  return {
    ...pricing,
    rentalFee: splitValue(pricing.rentalFee),
    originalRentalFee: splitValue(pricing.originalRentalFee),
    discountedRentalFee: splitValue(pricing.discountedRentalFee),
    insurance: splitValue(pricing.insurance),
    deposit: hasInsurance ? '0' : splitValue(pricing.deposit),
    deliveryFee: splitValue(pricing.deliveryFee),
    extrasFee: splitValue(pricing.extrasFee),
  };
};
