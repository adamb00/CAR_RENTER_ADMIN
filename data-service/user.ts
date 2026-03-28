import { db } from '@/lib/db';
import type { NewUserSchemaType } from '@/schemas/userSchema';
import bcryptjs from 'bcryptjs';

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({ where: { email } });

    return user;
  } catch {
    return null;
  }
};
export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({ where: { id } });

    return user;
  } catch {
    return null;
  }
};

export const createUser = async (values: NewUserSchemaType) => {
  try {
    const existingUser = await getUserByEmail(values.email);

    if (existingUser) {
      return { error: 'Ez az e-mail cím már használatban van.' };
    }

    const hashedPassword = await bcryptjs.hash(values.password, 10);

    const user = await db.user.create({
      data: {
        email: values.email,
        password: hashedPassword,
        name: values.name.toString(),
        signatureData: values.signatureData,
      },
    });

    return { success: 'A felhasználó sikeresen létrejött.', user };
  } catch (error) {
    console.error('createUser data-service', error);
    return {
      error:
        'A felhasználó létrehozása közben hiba történt. Próbáld meg később.',
    };
  }
};

export const getAllUser = async () => {
  const users = await db.user.findMany();

  return users;
};
