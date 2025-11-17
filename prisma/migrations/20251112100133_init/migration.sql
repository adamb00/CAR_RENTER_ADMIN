-- CreateEnum
CREATE TYPE "CarCategory" AS ENUM ('small', 'medium', 'large', 'suv');

-- CreateEnum
CREATE TYPE "CarTransmission" AS ENUM ('manual', 'automatic');

-- CreateEnum
CREATE TYPE "CarFuel" AS ENUM ('petrol', 'diesel', 'electric', 'hybrid');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('available', 'rented', 'maintenance', 'inactive');

-- CreateEnum
CREATE TYPE "CarBodyType" AS ENUM ('sedan', 'hatchback', 'suv', 'wagon', 'van', 'pickup', 'coupe');

-- CreateEnum
CREATE TYPE "CarTireType" AS ENUM ('summer', 'winter', 'all_season');

-- CreateTable
CREATE TABLE "Cars" (
    "licensePlate" TEXT NOT NULL,
    "category" "CarCategory" NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "firstRegistration" TIMESTAMP(3) NOT NULL,
    "bodyType" "CarBodyType" NOT NULL,
    "colors" TEXT[],
    "dailyPrices" INTEGER[],
    "images" TEXT[],
    "description" TEXT,
    "odometer" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL,
    "smallLuggage" INTEGER NOT NULL,
    "largeLuggage" INTEGER NOT NULL,
    "transmission" "CarTransmission" NOT NULL,
    "fuel" "CarFuel" NOT NULL,
    "vin" TEXT NOT NULL,
    "engineNumber" TEXT NOT NULL,
    "fleetJoinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CarStatus" NOT NULL DEFAULT 'available',
    "inspectionValidUntil" TIMESTAMP(3) NOT NULL,
    "tires" "CarTireType" NOT NULL,
    "nextServiceAt" TIMESTAMP(3),
    "serviceNotes" TEXT,
    "notes" TEXT,
    "knownDamages" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cars_pkey" PRIMARY KEY ("licensePlate")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cars_vin_key" ON "Cars"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Cars_engineNumber_key" ON "Cars"("engineNumber");
