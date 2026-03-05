import { numberFormatter } from '@/lib/format/format-number';
import { ParsedMonthKey } from './types';
import { MONTH_KEY_PATTERN } from '@/lib/constants';

export const buildMonthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`;

export const parseMonthKey = (value?: string | null): ParsedMonthKey => {
  const trimmed = value?.trim();
  const now = new Date();

  if (!trimmed) {
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    };
  }

  const match = trimmed.match(MONTH_KEY_PATTERN);
  if (!match) {
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    };
  }

  return {
    year: Number.parseInt(match[1], 10),
    month: Number.parseInt(match[2], 10),
  };
};

export const shiftMonthKey = (value: string, diff: number): string => {
  const parsed = parseMonthKey(value);
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + diff, 1));
  return buildMonthKey(date.getUTCFullYear(), date.getUTCMonth() + 1);
};
