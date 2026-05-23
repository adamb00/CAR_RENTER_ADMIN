import z from 'zod';

export const NewAccommodationSchema = z.object({
  name: z.string().min(1, 'A szállás neve kötelező'),
  country: z.string().min(1, 'Az ország kötelező'),
  postalCode: z.string().min(1, 'Az irányítószám kötelező'),
  city: z.string().min(1, 'A város kötelező'),
  street: z.string().min(1, 'Az utca kötelező'),
  houseNumber: z.string().min(1, 'A házszám kötelező'),
  island: z.string().min(1, 'A szállás szigete kötelező'),
  email: z
    .string()
    .min(1, 'A szállás email címe kötelező')
    .email('Érvénytelen email cím'),
});

export type NewAccommodationValues = z.input<typeof NewAccommodationSchema>;
