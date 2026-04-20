export const DEFAULT_HANDOVER_COST_TYPE_SLUGS = [
  'tip',
  'fuel',
  'ferry',
  'cleaning',
  'commission',
] as const;

export type DefaultHandoverCostTypeSlug =
  (typeof DEFAULT_HANDOVER_COST_TYPE_SLUGS)[number];

export type HandoverCostTypeCategory = 'expense' | 'deduction';

export const DEFAULT_HANDOVER_COST_TYPES: Array<{
  slug: DefaultHandoverCostTypeSlug;
  label: string;
  category: HandoverCostTypeCategory;
  sortOrder: number;
}> = [
  { slug: 'tip', label: 'Jatt', category: 'deduction', sortOrder: 10 },
  { slug: 'fuel', label: 'Tankolás', category: 'expense', sortOrder: 20 },
  { slug: 'ferry', label: 'Komp', category: 'expense', sortOrder: 30 },
  // { slug: 'cleaning', label: 'Takarítás', category: 'expense', sortOrder: 40 },
  {
    slug: 'commission',
    label: 'Jutalék',
    category: 'deduction',
    sortOrder: 40,
  },
];

export const HANDOVER_COST_TYPE_CATEGORY_OPTIONS: Array<{
  value: HandoverCostTypeCategory;
  label: string;
}> = [
  { value: 'expense', label: 'Költség' },
  { value: 'deduction', label: 'Levonás' },
];

export const getHandoverCostTypeCategoryLabel = (
  value: HandoverCostTypeCategory,
) =>
  HANDOVER_COST_TYPE_CATEGORY_OPTIONS.find((option) => option.value === value)
    ?.label ?? value;

export const isDefaultHandoverCostTypeSlug = (
  value: string,
): value is DefaultHandoverCostTypeSlug =>
  DEFAULT_HANDOVER_COST_TYPE_SLUGS.includes(
    value as DefaultHandoverCostTypeSlug,
  );

export const getDefaultHandoverCostTypeLabel = (slug: string) =>
  DEFAULT_HANDOVER_COST_TYPES.find((item) => item.slug === slug)?.label ?? slug;

export const getDefaultHandoverCostTypeCategory = (
  slug: string,
): HandoverCostTypeCategory =>
  DEFAULT_HANDOVER_COST_TYPES.find((item) => item.slug === slug)?.category ??
  'expense';

export const toHandoverCostTypeSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
