import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const supportedLocaleSet = new Set(['en', 'hu', 'de', 'ro', 'fr', 'es', 'it']);
export const PAYMENT_METHOD_VALUES = [
  'advance_transfer',
  'cash_on_pickup',
  'card_on_pickup',
  'bizum_on_pickup',
  'revolut_on_pickup',
] as const;

export const registerNewRentSchema = z
  .object({
    accommodationId: z.string().min(1, 'Accommodation is required.'),
    locale: z.string().default('en'),
    name: z.string().trim().min(1, 'Name is required.'),
    email: z.string().default(''),
    phone: z.string().default(''),
    rentalStart: z.string().default(''),
    rentalEnd: z.string().default(''),
    wantsInsurance: z.boolean().default(false),
    selectedCarId: z.string().default(''),
    paymentMethod: z.string().default(''),
    cars: z.string().default('1'),
    preferredChannel: z.string().default(''),
    partySize: z.string().optional(),
    children: z.string().optional(),
    handoverPlaceType: z.string().optional(),
    handoverLocationName: z.string().optional(),
    arrivalFlight: z.string().optional(),
    departureFlight: z.string().optional(),
    arrivalHour: z.string().optional(),
    arrivalMinute: z.string().optional(),
    notes: z.string().trim().max(1000).optional(),
    driverName: z.string().trim().min(1, 'Primary driver name is required.'),
    driverPostalCode: z
      .string()
      .trim()
      .min(1, 'Primary driver postal code is required.'),
    driverCity: z.string().trim().min(1, 'Primary driver city is required.'),
    driverCountry: z
      .string()
      .trim()
      .min(1, 'Primary driver country is required.'),
    driverStreet: z
      .string()
      .trim()
      .min(1, 'Primary driver street is required.'),
    driverHouseNumber: z
      .string()
      .trim()
      .min(1, 'Primary driver house number is required.'),
    driverBirthDate: z
      .string()
      .trim()
      .min(1, 'Primary driver birth date is required.'),
    driverPhone: z
      .string()
      .trim()
      .min(1, 'Primary driver phone number is required.'),
    driverEmail: z.string().trim().min(1, 'Primary driver email is required.'),
    driverLicenseNumber: z
      .string()
      .trim()
      .min(1, 'Driver license number is required.'),
    driverLicenseCategory: z
      .string()
      .trim()
      .min(1, 'Highest driver license category is required.'),
    driverLicenseExpiryDate: z
      .string()
      .trim()
      .min(1, 'Driver license expiry date is required.'),
    driverLicenseOlderThan3Years: z.boolean().default(false),
    billingSameAsPrimaryDriver: z.boolean().default(false),
    billingName: z.string().trim().min(1, 'Billing name is required.'),
    billingPostalCode: z
      .string()
      .trim()
      .min(1, 'Billing postal code is required.'),
    billingCity: z.string().trim().min(1, 'Billing city is required.'),
    billingCountry: z.string().trim().min(1, 'Billing country is required.'),
    billingStreet: z.string().trim().min(1, 'Billing street is required.'),
    billingHouseNumber: z
      .string()
      .trim()
      .min(1, 'Billing house number is required.'),
    billingTaxNumber: z.string().optional(),
    billingCompanyName: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const locale = values.locale.trim().toLowerCase();
    const rentalStart = values.rentalStart.trim();
    const rentalEnd = values.rentalEnd.trim();
    const selectedCarId = values.selectedCarId.trim();
    const paymentMethod = values.paymentMethod.trim();
    const cars = values.cars.trim();
    const arrivalHour = (values.arrivalHour ?? '').trim();
    const arrivalMinute = (values.arrivalMinute ?? '').trim();
    const driverBirthDate = values.driverBirthDate.trim();
    const driverLicenseExpiryDate = values.driverLicenseExpiryDate.trim();

    if (!supportedLocaleSet.has(locale)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid locale.',
        path: ['locale'],
      });
    }

    if (rentalStart && !dateRegex.test(rentalStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must be in YYYY-MM-DD format.',
        path: ['rentalStart'],
      });
    }

    if (rentalEnd && !dateRegex.test(rentalEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be in YYYY-MM-DD format.',
        path: ['rentalEnd'],
      });
    }

    if (rentalStart && rentalEnd && rentalStart > rentalEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date cannot be earlier than start date.',
        path: ['rentalEnd'],
      });
    }

    if (selectedCarId && selectedCarId.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid car selection.',
        path: ['selectedCarId'],
      });
    }

    if (
      paymentMethod &&
      !PAYMENT_METHOD_VALUES.includes(
        paymentMethod as (typeof PAYMENT_METHOD_VALUES)[number],
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid payment method.',
        path: ['paymentMethod'],
      });
    }

    if (!cars) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cars is required.',
        path: ['cars'],
      });
      return;
    }

    const parsedCars = Number(cars);
    if (!Number.isInteger(parsedCars) || parsedCars <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cars must be a positive integer.',
        path: ['cars'],
      });
    }

    if (arrivalHour) {
      const parsedHour = Number(arrivalHour);
      if (!Number.isInteger(parsedHour) || parsedHour < 0 || parsedHour > 23) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Arrival hour must be between 0 and 23.',
          path: ['arrivalHour'],
        });
      }
    }

    if (arrivalMinute) {
      const parsedMinute = Number(arrivalMinute);
      if (
        !Number.isInteger(parsedMinute) ||
        parsedMinute < 0 ||
        parsedMinute > 59
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Arrival minute must be between 0 and 59.',
          path: ['arrivalMinute'],
        });
      }
    }

    if (driverBirthDate && !dateRegex.test(driverBirthDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Primary driver birth date must be in YYYY-MM-DD format.',
        path: ['driverBirthDate'],
      });
    }

    if (driverLicenseExpiryDate && !dateRegex.test(driverLicenseExpiryDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Driver license expiry date must be in YYYY-MM-DD format.',
        path: ['driverLicenseExpiryDate'],
      });
    }
  });

export type RegisterNewRentInput = z.input<typeof registerNewRentSchema>;
export type RegisterNewRentValues = z.output<typeof registerNewRentSchema>;
