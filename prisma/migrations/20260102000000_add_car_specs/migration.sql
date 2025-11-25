-- Add enums for car specifications
CREATE TYPE "CarBodyType" AS ENUM ('sedan', 'hatchback', 'suv', 'wagon', 'van', 'pickup', 'coupe');
CREATE TYPE "CarFuel" AS ENUM ('petrol', 'diesel', 'electric', 'hybrid');
CREATE TYPE "CarTransmission" AS ENUM ('manual', 'automatic');

-- Extend Cars table with new fields and remove the old luggage column
ALTER TABLE "Cars"
  ADD COLUMN "smallLuggage" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "largeLuggage" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bodyType" "CarBodyType" NOT NULL DEFAULT 'sedan',
  ADD COLUMN "fuel" "CarFuel" NOT NULL DEFAULT 'petrol',
  ADD COLUMN "transmission" "CarTransmission" NOT NULL DEFAULT 'manual',
  DROP COLUMN "luggage";
