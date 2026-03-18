CREATE TABLE "Renters" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "taxId" TEXT,
  "companyName" TEXT,
  "paymentMethod" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT "Renters_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RentRequests"
ADD COLUMN "renterId" UUID;

CREATE INDEX "idx_renters_name" ON "Renters"("name");
CREATE UNIQUE INDEX "Renters_email_key" ON "Renters"("email");
CREATE INDEX "idx_rentrequests_renter" ON "RentRequests"("renterId");

WITH renter_seed AS (
  SELECT
    rr."id" AS booking_id,
    gen_random_uuid() AS renter_id,
    COALESCE(NULLIF(BTRIM(rr."contactname"), ''), 'Ismeretlen') AS renter_name,
    NULLIF(BTRIM(rr."contactemail"), '') AS renter_email,
    NULLIF(BTRIM(rr."contactphone"), '') AS renter_phone,
    NULLIF(BTRIM(rr."payload"::jsonb -> 'tax' ->> 'id'), '') AS renter_tax_id,
    NULLIF(BTRIM(rr."payload"::jsonb -> 'tax' ->> 'companyName'), '') AS renter_company_name,
    NULLIF(BTRIM(rr."payload"::jsonb -> 'consents' ->> 'paymentMethod'), '') AS renter_payment_method,
    COALESCE(rr."createdAt", timezone('utc'::text, now())) AS renter_created_at,
    COALESCE(rr."updatedAt", timezone('utc'::text, now())) AS renter_updated_at
  FROM "RentRequests" rr
  WHERE rr."renterId" IS NULL
),
inserted_renters AS (
  INSERT INTO "Renters" (
    "id",
    "name",
    "email",
    "phone",
    "taxId",
    "companyName",
    "paymentMethod",
    "createdAt",
    "updatedAt"
  )
  SELECT
    rs.renter_id,
    rs.renter_name,
    rs.renter_email,
    rs.renter_phone,
    rs.renter_tax_id,
    rs.renter_company_name,
    rs.renter_payment_method,
    rs.renter_created_at,
    rs.renter_updated_at
  FROM renter_seed rs
  RETURNING "id"
)
UPDATE "RentRequests" rr
SET "renterId" = rs.renter_id
FROM renter_seed rs
WHERE rr."id" = rs.booking_id;

ALTER TABLE "RentRequests"
ADD CONSTRAINT "RentRequests_renterId_fkey"
FOREIGN KEY ("renterId") REFERENCES "Renters"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
