import { z } from 'zod';

export const LoginSchema = z.object({
   email: z
      .string({ required_error: 'Kérjük adja meg az e-mail címét' })
      .min(1, 'Kérjük adja meg az e-mail címét')
      .email('Helytelen e-mail cím'),
   password: z
      .string({ required_error: 'Kérjük adja meg a jelszavát' })
      .min(1, 'Kérjük adja meg a jelszavát')
      .min(8, 'A jelszónak legalább 8 karakternek kell lennie')
      .max(32, 'A jelszó legfeljebb 32 karakter lehet')
      .regex(/[!@#$%^&*(),.?":{}|<>+\-=_/\\]/, 'A jelszónak legalább 1 speciális karaktert tartalmaznia kell')
      .regex(/[A-Z]/, 'A jelszónak legalább 1 nagybetűt tartalmaznia kell')
      .regex(/[a-z]/, 'A jelszónak legalább 1 kisbetűt tartalmaznia kell'),
});
