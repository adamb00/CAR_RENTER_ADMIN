import z from 'zod';

export const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().min(1).email(),
});

export const NewUserSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Kérjük adja meg a jelszavát')
      .min(8, 'A jelszónak legalább 8 karakternek kell lennie')
      .max(32, 'A jelszó legfeljebb 32 karakter lehet')
      .regex(
        /[!@#$%^&*(),.?":{}|<>+\-=_/\\]/,
        'A jelszónak legalább 1 speciális karaktert tartalmaznia kell',
      )
      .regex(/[A-Z]/, 'A jelszónak legalább 1 nagybetűt tartalmaznia kell')
      .regex(/[a-z]/, 'A jelszónak legalább 1 kisbetűt tartalmaznia kell'),
    signatureData: z.string().min(1),
  })
  .extend(UserSchema.shape);

export type UserSchemaType = z.input<typeof UserSchema>;
export type NewUserSchemaType = z.input<typeof NewUserSchema>;
