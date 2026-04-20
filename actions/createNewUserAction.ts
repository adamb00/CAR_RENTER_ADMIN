'use server';

import NewUserEmail from '@/components/emails/new-user-email';
import { createUser } from '@/data-service/user';
import { BOOKING_FROM_ADDRESS, getTransporter } from '@/lib/mailer';
import {
  NewUserSchema,
  NewUserSchemaType,
  UserSchema,
} from '@/schemas/userSchema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import z from 'zod';

type CreateNewUserActionResult = {
  success?: string;
  error?: string;
};

const buildHtmlBody = async ({
  name,
  email,
  slackUserId,
}: {
  name: string;
  email: string;
  slackUserId: string;
}): Promise<string> => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const html = renderToStaticMarkup(NewUserEmail({ name, email, slackUserId }));

  return `<!doctype html>${html}`;
};

export const createNewUserAction = async (
  values: z.infer<typeof UserSchema>,
): Promise<CreateNewUserActionResult> => {
  const validatedFields = await UserSchema.safeParseAsync(values);

  if (!validatedFields.success) {
    return { error: 'Hibás adatok. Kérjük próbáld meg újból!' };
  }

  const { name, email, slackUserId } = validatedFields.data;

  const html = await buildHtmlBody({ name, email, slackUserId });

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: BOOKING_FROM_ADDRESS,
      to: email,
      subject: 'Új rendszerszintű felhasználó hozzáadása',
      html,
    });
  } catch (error) {
    console.error('createNewUserAction sendMail', error);
    return {
      error: 'Az e-mail küldése közben hiba történt. Próbáld meg később.',
    };
  }

  return { success: 'Az e-mail sikeresen elküldve.' };
};

export const createUserAction = async (values: NewUserSchemaType) => {
  const validatedFields = await NewUserSchema.safeParseAsync(values);

  if (!validatedFields.success) {
    return { error: 'Hibás adatok. Kérjük próbáld meg újból!' };
  }

  const res = await createUser(validatedFields.data);

  if (res.success) {
    revalidatePath('/auth/login');
    redirect('/auth/login');
  }
};
