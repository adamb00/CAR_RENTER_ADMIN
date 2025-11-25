import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
   return new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasourceUrl: process.env.DATABASE_URL,
   });
};

declare const globalThis: {
   prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const db = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = db;
