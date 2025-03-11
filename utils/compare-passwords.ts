import { compare } from 'bcryptjs';

export const runtime = 'nodejs';
export const comparePasswords = async (password: string, userPassword: string) => await compare(password, userPassword);
