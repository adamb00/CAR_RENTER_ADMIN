import { LOCALIZED_STATIC } from './localized-static';

export const getStaticTexts = (locale: string) =>
  LOCALIZED_STATIC[locale] ?? LOCALIZED_STATIC.en;
