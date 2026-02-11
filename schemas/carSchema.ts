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
    colors: z.array(z.enum(CAR_COLORS)).min(1, 'Legalább egy színt válassz.').max(
      CAR_COLORS.length,
      'Túl sok színt jelöltél be.'
    ),
    images: z
      .array(z.string().url('Adj meg érvényes kép URL-t.'))
      .min(1, 'Adj meg legalább egy képet.')
      .max(3, 'Legfeljebb 3 képet tölthetsz fel.'),
  })
  .superRefine(() => undefined);

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
    colors: z
      .array(z.enum(CAR_COLORS))
      .min(1, 'Legalább egy színt válassz.')
      .max(CAR_COLORS.length, 'Túl sok színt jelöltél be.'),
    images: z
      .array(z.string().url('Adj meg érvényes kép URL-t.'))
      .min(1, 'Adj meg legalább egy képet.')
      .max(3, 'Legfeljebb 3 képet tölthetsz fel.'),
  })
  .superRefine(() => undefined);

export type CreateCarInput = z.infer<typeof CreateCarSchema>;

export const transformCarFormValues = (values: CreateCarFormValues): CreateCarInput => {
  const normalizedColors = Array.from(new Set(values.colors ?? []));
  const monthlyPrices = (values.monthlyPrices ?? []).map((price) =>
    typeof price === 'number' ? price : Number(price)
  );

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
    colors: normalizedColors,
    images: values.images,
  };
};
