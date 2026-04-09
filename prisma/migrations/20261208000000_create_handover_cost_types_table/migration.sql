ALTER TYPE "HandoverCostType" ADD VALUE IF NOT EXISTS 'custom';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'HandoverCostCategory'
  ) THEN
    CREATE TYPE "HandoverCostCategory" AS ENUM ('expense', 'deduction');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "HandoverCustomCostTypes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" VARCHAR(64) NOT NULL,
  "label" VARCHAR(120) NOT NULL,
  "category" "HandoverCostCategory" NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT "HandoverCustomCostTypes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "handover_custom_cost_types_slug_key"
  ON "HandoverCustomCostTypes"("slug");

CREATE INDEX IF NOT EXISTS "idx_handover_cost_type_category_sort"
  ON "HandoverCustomCostTypes"("category", "sortOrder");

ALTER TABLE "BookingHandoverCosts"
  ADD COLUMN IF NOT EXISTS "customCostTypeSlug" VARCHAR(64);

CREATE INDEX IF NOT EXISTS "idx_booking_handover_cost_custom_type_slug"
  ON "BookingHandoverCosts"("customCostTypeSlug");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'BookingHandoverCosts_customCostTypeSlug_fkey'
  ) THEN
    ALTER TABLE "BookingHandoverCosts"
      ADD CONSTRAINT "BookingHandoverCosts_customCostTypeSlug_fkey"
      FOREIGN KEY ("customCostTypeSlug") REFERENCES "HandoverCustomCostTypes"("slug")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;
