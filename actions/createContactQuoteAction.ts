'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { LOCALE_LABELS } from '@/lib/constants';
import { db } from '@/lib/db';
import { getNextHumanId } from '@/lib/human-id';

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SUPPORTED_LOCALE_SET = new Set(Object.keys(LOCALE_LABELS));

const createContactQuoteSchema = z
  .object({
    name: z.string().trim().min(1, 'Név kötelező'),
    email: z.string().default(''),
    phone: z.string().default(''),
    locale: z.string().default('en'),
    rentalStart: z.string().optional(),
    rentalEnd: z.string().optional(),
    preferredChannel: z.enum(['email', 'whatsapp']),
    carId: z.string().optional(),
    cars: z.string().default('1'),
  })
  .superRefine((values, ctx) => {
    const email = values.email.trim();
    const phone = values.phone.trim();
    const locale = values.locale.trim().toLowerCase();
    const rentalStart = values.rentalStart?.trim() ?? '';
    const rentalEnd = values.rentalEnd?.trim() ?? '';
    const cars = values.cars.trim();

    if (!SUPPORTED_LOCALE_SET.has(locale)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvénytelen nyelvkód',
        path: ['locale'],
      });
    }

    if (values.preferredChannel === 'email') {
      if (!email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'E-mail kötelező az e-mail küldéshez',
          path: ['email'],
        });
      } else if (!z.string().email().safeParse(email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Érvényes e-mail címet adj meg',
          path: ['email'],
        });
      }
    }

    if (values.preferredChannel === 'whatsapp' && !phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefonszám kötelező WhatsApp küldéshez',
        path: ['phone'],
      });
    }

    if (rentalStart && !DATE_INPUT_PATTERN.test(rentalStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvényes kezdő dátum szükséges (ÉÉÉÉ-HH-NN)',
        path: ['rentalStart'],
      });
    }

    if (rentalEnd && !DATE_INPUT_PATTERN.test(rentalEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvényes záró dátum szükséges (ÉÉÉÉ-HH-NN)',
        path: ['rentalEnd'],
      });
    }

    if (rentalStart && rentalEnd && rentalStart > rentalEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A záró dátum nem lehet korábbi a kezdésnél',
        path: ['rentalEnd'],
      });
    }

    if (!cars) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Autók száma kötelező',
        path: ['cars'],
      });
      return;
    }

    const parsedCars = Number(cars);
    if (!Number.isInteger(parsedCars) || parsedCars <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pozitív egész autószám szükséges',
        path: ['cars'],
      });
    }
  });

type CreateContactQuoteInput = z.input<typeof createContactQuoteSchema>;

type CreateContactQuoteResult = {
  error?: string;
  quote?: {
    id: string;
    humanId?: string | null;
    name: string;
    email: string;
    phone: string;
    locale: string;
    rentalStart?: string | null;
    rentalEnd?: string | null;
    carId?: string | null;
    cars?: string | null;
  };
};

const parseDateInput = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!DATE_INPUT_PATTERN.test(trimmed)) return null;
  return new Date(`${trimmed}T00:00:00.000Z`);
};

export const createContactQuoteAction = async (
  input: CreateContactQuoteInput,
): Promise<CreateContactQuoteResult> => {
  const parsed = createContactQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Hibás ajánlat adatok.' };
  }

  const values = parsed.data;
  const requestedLocale = values.locale.trim().toLowerCase();
  const locale = SUPPORTED_LOCALE_SET.has(requestedLocale)
    ? requestedLocale
    : 'en';
  const rentalStart = parseDateInput(values.rentalStart);
  const rentalEnd = parseDateInput(values.rentalEnd);
  const requestedCarId = values.carId?.trim() || null;
  const requestedCars = values.cars.trim();

  let carName: string | null = null;
  if (requestedCarId) {
    const car = await db.car.findUnique({
      where: { id: requestedCarId },
      select: {
        manufacturer: true,
        model: true,
      },
    });
    if (!car) {
      return { error: 'A kiválasztott autó nem található.' };
    }
    carName = `${car.manufacturer} ${car.model}`.trim();
  }

  const nextHumanId = await getNextHumanId('ContactQuotes');

  try {
    const quote = await db.contactQuotes.create({
      data: {
        humanId: nextHumanId ?? undefined,
        locale,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        preferredchannel: values.preferredChannel,
        rentalstart: rentalStart,
        rentalend: rentalEnd,
        arrivalflight: null,
        departureflight: null,
        carid: requestedCarId,
        carname: carName,
        cars: requestedCars,
        extras: [],
      },
      select: {
        id: true,
        humanId: true,
        name: true,
        email: true,
        phone: true,
        locale: true,
        rentalstart: true,
        rentalend: true,
        carid: true,
        cars: true,
      },
    });

    revalidatePath('/quotes');

    return {
      quote: {
        id: quote.id,
        humanId: quote.humanId,
        name: quote.name,
        email: quote.email,
        phone: quote.phone,
        locale: quote.locale,
        rentalStart: quote.rentalstart?.toISOString().slice(0, 10) ?? null,
        rentalEnd: quote.rentalend?.toISOString().slice(0, 10) ?? null,
        carId: quote.carid,
        cars: quote.cars,
      },
    };
  } catch (error) {
    console.error('createContactQuoteAction create', error);
    return { error: 'Az új ajánlatkérés mentése sikertelen volt.' };
  }
};
