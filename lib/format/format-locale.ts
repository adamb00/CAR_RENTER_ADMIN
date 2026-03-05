import { LOCALE_LABELS } from '../constants';

export const formatLocale = (locale: string | null | undefined) =>
  locale ? (LOCALE_LABELS[locale] ?? locale) : '—';
