-- Reset Cars table to keep only the minimal fields we need
DROP TABLE IF EXISTS "Cars";

-- Drop unused enums from the previous schema
DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CarCategory') THEN
      DROP TYPE "CarCategory";
   END IF;
   IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CarTransmission') THEN
      DROP TYPE "CarTransmission";
   END IF;
   IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CarFuel') THEN
      DROP TYPE "CarFuel";
   END IF;
   IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CarStatus') THEN
      DROP TYPE "CarStatus";
   END IF;
   IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CarBodyType') THEN
      DROP TYPE "CarBodyType";
   END IF;
   IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CarTireType') THEN
      DROP TYPE "CarTireType";
   END IF;
END;
$$;

-- Create the simplified Cars table
CREATE TABLE "Cars" (
    "id" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "luggage" INTEGER NOT NULL,
    "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cars_pkey" PRIMARY KEY ("id")
);
