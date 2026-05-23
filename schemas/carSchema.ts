import { z } from 'zod';

import {
  CAR_BODY_TYPES,
  CAR_COLORS,
  CAR_FUELS,
  CAR_TRANSMISSIONS,
} from '@/lib/car-options';

const positiveInt = (fieldLabel: string, minValue = 1) =>
  z.coerce.number().int().min(minValue, `${fieldLabel} minimum ${minValue}.`);

const nonNegativeInt = (fieldLabel: string) =>
  z.coerce.number().int().min(0, `${fieldLabel} minimum 0.`);

const AccommodationPriceSchema = z.object({
  days: positiveInt('Napok száma'),
  price_eur: nonNegativeInt('Szállodai ár (EUR)').max(
    10_000_000,
    'Az ár nem lehet 10 000 000 felett.',
  ),
  full_insurance_eur: nonNegativeInt('Teljes biztosítás (EUR)').max(
    10_000_000,
    'A biztosítás nem lehet 10 000 000 felett.',
  ),
});

export const CreateCarFormSchema = z
  .object({
    manufacturer: z.string().min(2, 'A gyártó neve legalább 2 karakter legyen.'),
    model: z.string().min(2, 'Add meg a típus nevét.'),
    seats: positiveInt('Szállítható személyek száma'),
    smallLuggage: nonNegativeInt('Kis bőröndök száma'),
    largeLuggage: nonNegativeInt('Nagy bőröndök száma'),
    bodyType: z.enum(CAR_BODY_TYPES),
    fuel: z.enum(CAR_FUELS),
    transmission: z.enum(CAR_TRANSMISSIONS),
    monthlyPrices: z
      .array(
        positiveInt('Havi ár', 0).max(
          10_000_000,
          'Az ár nem lehet 10 000 000 Ft felett.'
        )
      )
      .length(12, 'Mind a 12 hónaphoz adj meg árat.'),
    accommodationPrices: z
      .array(AccommodationPriceSchema)
      .min(1, 'Adj meg legalább egy szállodai napi árat.'),
    colors: z.array(z.enum(CAR_COLORS)).min(1, 'Legalább egy színt válassz.').max(
      CAR_COLORS.length,
      'Túl sok színt jelöltél be.'
    ),
    images: z
      .array(z.string().url('Adj meg érvényes kép URL-t.'))
      .min(1, 'Adj meg legalább egy képet.')
      .max(3, 'Legfeljebb 3 képet tölthetsz fel.'),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<number>();
    data.accommodationPrices.forEach((entry, index) => {
      if (seen.has(entry.days)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accommodationPrices', index, 'days'],
          message: 'Ez a nap már szerepel a listában.',
        });
      } else {
        seen.add(entry.days);
      }
    });
  });

export type CreateCarFormValues = z.output<typeof CreateCarFormSchema>;
export type CreateCarFormInput = z.input<typeof CreateCarFormSchema>;

export const CreateCarSchema = z
  .object({
    manufacturer: z.string(),
    model: z.string(),
    seats: z.number().int().min(1),
    smallLuggage: z.number().int().min(0),
    largeLuggage: z.number().int().min(0),
    bodyType: z.enum(CAR_BODY_TYPES),
    fuel: z.enum(CAR_FUELS),
    transmission: z.enum(CAR_TRANSMISSIONS),
    monthlyPrices: z
      .array(z.number().int().min(0).max(10_000_000))
      .length(12, 'Mind a 12 hónaphoz adj meg árat.'),
    accommodationPrices: z
      .array(AccommodationPriceSchema)
      .min(1, 'Adj meg legalább egy szállodai napi árat.'),
    colors: z
      .array(z.enum(CAR_COLORS))
      .min(1, 'Legalább egy színt válassz.')
      .max(CAR_COLORS.length, 'Túl sok színt jelöltél be.'),
    images: z
      .array(z.string().url('Adj meg érvényes kép URL-t.'))
      .min(1, 'Adj meg legalább egy képet.')
      .max(3, 'Legfeljebb 3 képet tölthetsz fel.'),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<number>();
    data.accommodationPrices.forEach((entry, index) => {
      if (seen.has(entry.days)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accommodationPrices', index, 'days'],
          message: 'Ez a nap már szerepel a listában.',
        });
      } else {
        seen.add(entry.days);
      }
    });
  });

export type CreateCarInput = z.infer<typeof CreateCarSchema>;

export const transformCarFormValues = (values: CreateCarFormValues): CreateCarInput => {
  const normalizedColors = Array.from(new Set(values.colors ?? []));
  const monthlyPrices = (values.monthlyPrices ?? []).map((price) =>
    typeof price === 'number' ? price : Number(price)
  );
  const accommodationPrices = (values.accommodationPrices ?? [])
    .map((entry) => ({
      days:
        typeof entry.days === 'number' ? entry.days : Number(entry.days),
      price_eur:
        typeof entry.price_eur === 'number'
          ? entry.price_eur
          : Number(entry.price_eur),
      full_insurance_eur:
        typeof entry.full_insurance_eur === 'number'
          ? entry.full_insurance_eur
          : Number(entry.full_insurance_eur),
    }))
    .sort((a, b) => a.days - b.days);

  return {
    manufacturer: values.manufacturer.trim(),
    model: values.model.trim(),
    seats: values.seats,
    smallLuggage: values.smallLuggage,
    largeLuggage: values.largeLuggage,
    bodyType: values.bodyType,
    fuel: values.fuel,
    transmission: values.transmission,
    monthlyPrices,
    accommodationPrices,
    colors: normalizedColors,
    images: values.images,
  };
};
