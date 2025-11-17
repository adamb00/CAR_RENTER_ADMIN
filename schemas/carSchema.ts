import { z } from 'zod';

import {
  CAR_BODY_TYPES,
  CAR_CATEGORIES,
  CAR_COLORS,
  CAR_FUELS,
  CAR_STATUSES,
  CAR_TIRE_TYPES,
  CAR_TRANSMISSIONS,
} from '@/lib/car-options';

const positiveInt = (fieldLabel: string, minValue = 1) =>
  z.coerce
    .number({
      invalid_type_error: `${fieldLabel} csak szám lehet.`,
    })
    .int(`${fieldLabel} egész szám legyen.`)
    .min(minValue, `${fieldLabel} minimum ${minValue}.`);

const nonNegativeInt = (fieldLabel: string) =>
  z.coerce
    .number({
      invalid_type_error: `${fieldLabel} csak szám lehet.`,
    })
    .int(`${fieldLabel} egész szám legyen.`)
    .min(0, `${fieldLabel} minimum 0.`);

const enumErrorMap = (requiredMessage: string, invalidMessage: string) => (issue: z.ZodIssueOptionalMessage) => {
  if (issue.code === z.ZodIssueCode.invalid_type && issue.received === 'undefined') {
    return { message: requiredMessage };
  }
  return { message: invalidMessage };
};

const dateString = (label: string) =>
  z
    .string()
    .min(1, `${label} megadása kötelező.`)
    .refine((value) => !Number.isNaN(Date.parse(value)), `${label} formátuma hibás.`);

export const RENTAL_DAY_THRESHOLDS = [1, 2, 3, 4, 5, 6, 7, 10, 14, 30] as const;
const DAY_KEYS = RENTAL_DAY_THRESHOLDS.map((_, index) => `day${index + 1}` as const);
type DayKey = (typeof DAY_KEYS)[number];
const DAY_COUNT = DAY_KEYS.length;

const DailyPricesFormSchema = z.object(
  DAY_KEYS.reduce(
    (shape, key, index) => {
      shape[key] = positiveInt(`${RENTAL_DAY_THRESHOLDS[index]} naptól (EUR)`);
      return shape;
    },
    {} as Record<DayKey, ReturnType<typeof positiveInt>>
  )
);

export const CreateCarFormSchema = z
  .object({
    licensePlate: z
      .string()
      .min(5, 'Adj meg legalább 5 karakteres rendszámot.')
      .regex(/^[A-Z0-9-]+$/i, 'Csak betű, szám és kötőjel szerepelhet a rendszámban.'),
    category: z.enum(CAR_CATEGORIES, {
      errorMap: enumErrorMap('Válassz kategóriát.', 'Érvénytelen kategória.'),
    }),
    manufacturer: z.string().min(2, 'A gyártó neve legalább 2 karakter legyen.'),
    model: z.string().min(2, 'Add meg a típus nevét.'),
    year: positiveInt('Évjárat', 1980).max(new Date().getFullYear() + 1, 'Érvénytelen évjárat.'),
    firstRegistration: dateString('Első forgalomba helyezés'),
    bodyType: z.enum(CAR_BODY_TYPES, {
      errorMap: enumErrorMap('Válassz kivitelt.', 'Érvénytelen kivitel.'),
    }),
    colors: z.array(z.enum(CAR_COLORS)).min(1, 'Válassz legalább egy színt.'),
    images: z
      .array(z.string().url('Adj meg érvényes kép URL-t.'))
      .min(1, 'Adj meg legalább egy képet.')
      .max(3, 'Legfeljebb 3 képet tölthetsz fel.'),
    description: z
      .string()
      .max(1000, 'A leírás legfeljebb 1000 karakter lehet.')
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || value.trim().length === 0 || value.trim().length >= 10, {
        message: 'A leírás legalább 10 karakter legyen vagy maradjon üresen.',
      }),
    dailyPrices: DailyPricesFormSchema,
    seats: positiveInt('Szállítható személyek száma'),
    odometer: positiveInt('Kilométeróra állás'),
    smallLuggage: nonNegativeInt('Kisméretű csomagok'),
    largeLuggage: nonNegativeInt('Nagyméretű csomagok'),
    transmission: z.enum(CAR_TRANSMISSIONS, {
      errorMap: enumErrorMap('Válassz váltót.', 'Érvénytelen váltótípus.'),
    }),
    fuel: z.enum(CAR_FUELS, {
      errorMap: enumErrorMap('Válassz üzemanyagot.', 'Érvénytelen üzemanyag típus.'),
    }),
    vin: z.string().min(10, 'Adj meg legalább 10 karakteres alvázszámot.'),
    engineNumber: z.string().min(5, 'Adj meg motorszámot.'),
    fleetJoinedAt: dateString('Flottába vétel dátuma'),
    status: z.enum(CAR_STATUSES, {
      errorMap: enumErrorMap('Válassz státuszt.', 'Érvénytelen státusz.'),
    }),
    inspectionValidUntil: dateString('Műszaki érvényesség'),
    tires: z.enum(CAR_TIRE_TYPES, {
      errorMap: enumErrorMap('Válassz gumitípust.', 'Érvénytelen gumitípus.'),
    }),
    nextServiceAt: z
      .string()
      .optional()
      .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Adj meg érvényes dátumot.'),
    serviceNotes: z.string().max(1000, 'Legfeljebb 1000 karakteres leírás legyen.').optional(),
    notes: z.string().max(1000, 'Legfeljebb 1000 karakteres megjegyzés legyen.').optional(),
    knownDamages: z.string().max(1000, 'Legfeljebb 1000 karakteres leírás legyen.').optional(),
  })
  .superRefine(() => undefined);

export type CreateCarFormValues = z.infer<typeof CreateCarFormSchema>;

export const CreateCarSchema = z
  .object({
    licensePlate: z.string(),
    category: z.enum(CAR_CATEGORIES),
    manufacturer: z.string(),
    model: z.string(),
    year: z.number().int().min(1900),
    firstRegistration: z.date(),
    bodyType: z.enum(CAR_BODY_TYPES),
    colors: z.array(z.enum(CAR_COLORS)).min(1, 'Válassz legalább egy színt.'),
    images: z
      .array(z.string().url('Adj meg érvényes kép URL-t.'))
      .min(1, 'Adj meg legalább egy képet.')
      .max(3, 'Legfeljebb 3 képet tölthetsz fel.'),
    description: z.string().optional(),
    dailyPrices: z
      .array(z.number().int().min(1, 'Az ár legyen legalább 1 EUR.'))
      .length(DAY_COUNT, `Pontosan ${DAY_COUNT} napi árat adj meg.`),
    seats: z.number().int().min(1),
    odometer: z.number().int().min(0),
    smallLuggage: z.number().int().min(0),
    largeLuggage: z.number().int().min(0),
    transmission: z.enum(CAR_TRANSMISSIONS),
    fuel: z.enum(CAR_FUELS),
    vin: z.string(),
    engineNumber: z.string(),
    fleetJoinedAt: z.date(),
    status: z.enum(CAR_STATUSES),
    inspectionValidUntil: z.date(),
    tires: z.enum(CAR_TIRE_TYPES),
    nextServiceAt: z.date().optional(),
    serviceNotes: z.string().optional(),
    notes: z.string().optional(),
    knownDamages: z.string().optional(),
  })
  .superRefine(() => undefined);

export type CreateCarInput = z.infer<typeof CreateCarSchema>;

const trimOrUndefined = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const toDate = (value: string) => new Date(value);

export const transformCarFormValues = (values: CreateCarFormValues): CreateCarInput => {
  const normalizedDailyPrices = DAY_KEYS.map((key) => values.dailyPrices[key]);

  return {
    licensePlate: values.licensePlate.trim().toUpperCase(),
    category: values.category,
    manufacturer: values.manufacturer.trim(),
    model: values.model.trim(),
    year: values.year,
    firstRegistration: toDate(values.firstRegistration),
    bodyType: values.bodyType,
    colors: values.colors,
    images: values.images,
    description: trimOrUndefined(values.description),
    dailyPrices: normalizedDailyPrices,
    seats: values.seats,
    odometer: values.odometer,
    smallLuggage: values.smallLuggage,
    largeLuggage: values.largeLuggage,
    transmission: values.transmission,
    fuel: values.fuel,
    vin: values.vin.trim().toUpperCase(),
    engineNumber: values.engineNumber.trim().toUpperCase(),
    fleetJoinedAt: toDate(values.fleetJoinedAt),
    status: values.status,
    inspectionValidUntil: toDate(values.inspectionValidUntil),
    tires: values.tires,
    nextServiceAt: values.nextServiceAt ? toDate(values.nextServiceAt) : undefined,
    serviceNotes: trimOrUndefined(values.serviceNotes),
    notes: trimOrUndefined(values.notes),
    knownDamages: trimOrUndefined(values.knownDamages),
  };
};
