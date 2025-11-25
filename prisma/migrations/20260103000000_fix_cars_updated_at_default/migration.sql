-- Align Cars.updatedAt default with Prisma schema
ALTER TABLE "Cars"
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
