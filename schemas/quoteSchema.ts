import { DATE_INPUT_PATTERN, SUPPORTED_LOCALE_SET } from '@/lib/constants';
import { optionalPrice, optionalText } from '@/lib/format/format-optional';
import z from 'zod';

const offerSchema = z.object({
  carId: z.string().min(1, 'Autó kiválasztása kötelező'),
  rentalFee: optionalPrice,
  deposit: optionalPrice,
  insurance: optionalPrice,
  deliveryFee: optionalPrice,
  deliveryLocation: optionalText,
  extrasFee: optionalPrice,
});

export const isSupportedLocale = (value?: string | null): value is string =>
  Boolean(value && SUPPORTED_LOCALE_SET.has(value));

export const quoteSendSchema = z
  .object({
    quoteMode: z.enum(['existing', 'new']),
    quoteId: z.string().default(''),
    channel: z.enum(['email', 'whatsapp']),
    sendLocale: z.string().default('en'),
    adminName: z.string().min(1, 'Név kötelező'),
    newName: z.string().default(''),
    newEmail: z.string().default(''),
    newPhone: z.string().default(''),
    newRentalStart: z.string().default(''),
    newRentalEnd: z.string().default(''),
    newCarId: z.string().default(''),
    offers: z.array(offerSchema).min(1, 'Legalább egy ajánlat szükséges'),
  })
  .superRefine((values, ctx) => {
    if (values.quoteMode === 'existing' && !values.quoteId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ajánlatkérés kiválasztása kötelező',
        path: ['quoteId'],
      });
    }

    if (!isSupportedLocale(values.sendLocale)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Válassz nyelvet a listából',
        path: ['sendLocale'],
      });
    }

    if (values.quoteMode !== 'new') return;

    const newEmail = values.newEmail.trim();
    const newPhone = values.newPhone.trim();

    if (!values.newName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Név kötelező',
        path: ['newName'],
      });
    }

    if (values.channel === 'email') {
      if (!newEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'E-mail kötelező',
          path: ['newEmail'],
        });
      } else if (!z.string().email().safeParse(newEmail).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Érvényes e-mail címet adj meg',
          path: ['newEmail'],
        });
      }
    } else if (!newPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefonszám kötelező',
        path: ['newPhone'],
      });
    }

    if (
      values.newRentalStart.trim() &&
      !DATE_INPUT_PATTERN.test(values.newRentalStart.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvényes dátum szükséges (ÉÉÉÉ-HH-NN)',
        path: ['newRentalStart'],
      });
    }

    if (
      values.newRentalEnd.trim() &&
      !DATE_INPUT_PATTERN.test(values.newRentalEnd.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvényes dátum szükséges (ÉÉÉÉ-HH-NN)',
        path: ['newRentalEnd'],
      });
    }

    const start = values.newRentalStart.trim();
    const end = values.newRentalEnd.trim();
    if (start && end && start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A záró dátum nem lehet korábbi a kezdésnél',
        path: ['newRentalEnd'],
      });
    }
  });

export type QuoteSendFormValues = z.output<typeof quoteSendSchema>;
export type QuoteSendFormInputs = z.input<typeof quoteSendSchema>;
