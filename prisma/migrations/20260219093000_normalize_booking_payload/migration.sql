-- CreateEnum
CREATE TYPE "HandoverCostType" AS ENUM ('tip', 'fuel', 'ferry', 'cleaning');

-- CreateTable
CREATE TABLE "BookingPricingSnapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "rentalFee" TEXT,
    "insurance" TEXT,
    "deposit" TEXT,
    "deliveryFee" TEXT,
    "extrasFee" TEXT,
    "tip" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "BookingPricingSnapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingDeliveryDetails" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "placeType" TEXT,
    "locationName" TEXT,
    "addressLine" TEXT,
    "arrivalFlight" TEXT,
    "departureFlight" TEXT,
    "arrivalHour" TEXT,
    "arrivalMinute" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "BookingDeliveryDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingHandoverCosts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "direction" "HandoverDirection" NOT NULL,
    "costType" "HandoverCostType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "BookingHandoverCosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingPricingSnapshots_bookingId_key" ON "BookingPricingSnapshots"("bookingId");

-- CreateIndex
CREATE INDEX "idx_booking_pricing_booking_id" ON "BookingPricingSnapshots"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingDeliveryDetails_bookingId_key" ON "BookingDeliveryDetails"("bookingId");

-- CreateIndex
CREATE INDEX "idx_booking_delivery_booking_id" ON "BookingDeliveryDetails"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_booking_handover_cost" ON "BookingHandoverCosts"("bookingId", "direction", "costType");

-- CreateIndex
CREATE INDEX "idx_booking_handover_cost_booking_id" ON "BookingHandoverCosts"("bookingId");

-- CreateIndex
CREATE INDEX "idx_booking_handover_cost_direction" ON "BookingHandoverCosts"("direction");

-- AddForeignKey
ALTER TABLE "BookingPricingSnapshots" ADD CONSTRAINT "BookingPricingSnapshots_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "RentRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDeliveryDetails" ADD CONSTRAINT "BookingDeliveryDetails_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "RentRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHandoverCosts" ADD CONSTRAINT "BookingHandoverCosts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "RentRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill pricing snapshot from payload
INSERT INTO "BookingPricingSnapshots" (
  "bookingId",
  "rentalFee",
  "insurance",
  "deposit",
  "deliveryFee",
  "extrasFee",
  "tip",
  "updatedAt"
)
SELECT
  rr."id" AS "bookingId",
  NULLIF(BTRIM(rr."payload"->'pricing'->>'rentalFee'), ''),
  NULLIF(BTRIM(rr."payload"->'pricing'->>'insurance'), ''),
  NULLIF(BTRIM(rr."payload"->'pricing'->>'deposit'), ''),
  NULLIF(BTRIM(rr."payload"->'pricing'->>'deliveryFee'), ''),
  NULLIF(BTRIM(rr."payload"->'pricing'->>'extrasFee'), ''),
  NULLIF(BTRIM(rr."payload"->'pricing'->>'tip'), ''),
  timezone('utc'::text, now())
FROM "RentRequests" rr
WHERE rr."payload" IS NOT NULL
  AND rr."payload"->'pricing' IS NOT NULL
ON CONFLICT ("bookingId") DO UPDATE SET
  "rentalFee" = EXCLUDED."rentalFee",
  "insurance" = EXCLUDED."insurance",
  "deposit" = EXCLUDED."deposit",
  "deliveryFee" = EXCLUDED."deliveryFee",
  "extrasFee" = EXCLUDED."extrasFee",
  "tip" = EXCLUDED."tip",
  "updatedAt" = timezone('utc'::text, now());

-- Backfill delivery details from payload
INSERT INTO "BookingDeliveryDetails" (
  "bookingId",
  "placeType",
  "locationName",
  "addressLine",
  "arrivalFlight",
  "departureFlight",
  "arrivalHour",
  "arrivalMinute",
  "updatedAt"
)
SELECT
  rr."id" AS "bookingId",
  NULLIF(BTRIM(rr."payload"->'delivery'->>'placeType'), ''),
  NULLIF(BTRIM(rr."payload"->'delivery'->>'locationName'), ''),
  NULLIF(
    BTRIM(
      COALESCE(
        rr."payload"->'delivery'->'address'->>'street',
        rr."payload"->'delivery'->>'address'
      )
    ),
    ''
  ),
  NULLIF(BTRIM(rr."payload"->'delivery'->>'arrivalFlight'), ''),
  NULLIF(BTRIM(rr."payload"->'delivery'->>'departureFlight'), ''),
  NULLIF(BTRIM(rr."payload"->'delivery'->>'arrivalHour'), ''),
  NULLIF(BTRIM(rr."payload"->'delivery'->>'arrivalMinute'), ''),
  timezone('utc'::text, now())
FROM "RentRequests" rr
WHERE rr."payload" IS NOT NULL
  AND rr."payload"->'delivery' IS NOT NULL
ON CONFLICT ("bookingId") DO UPDATE SET
  "placeType" = EXCLUDED."placeType",
  "locationName" = EXCLUDED."locationName",
  "addressLine" = EXCLUDED."addressLine",
  "arrivalFlight" = EXCLUDED."arrivalFlight",
  "departureFlight" = EXCLUDED."departureFlight",
  "arrivalHour" = EXCLUDED."arrivalHour",
  "arrivalMinute" = EXCLUDED."arrivalMinute",
  "updatedAt" = timezone('utc'::text, now());

-- Backfill handover costs from payload (tip, fuel, ferry, cleaning)
WITH extracted AS (
  SELECT rr."id" AS booking_id, 'out'::"HandoverDirection" AS direction, 'tip'::"HandoverCostType" AS cost_type,
         COALESCE(rr."payload"->>'handoverTip', rr."payload"->'pricing'->>'tip') AS raw_value
  FROM "RentRequests" rr
  WHERE rr."payload" IS NOT NULL

  UNION ALL
  SELECT rr."id", 'out'::"HandoverDirection", 'fuel'::"HandoverCostType",
         rr."payload"->'handoverCosts'->'out'->>'fuelCost'
  FROM "RentRequests" rr
  WHERE rr."payload" IS NOT NULL

  UNION ALL
  SELECT rr."id", 'out'::"HandoverDirection", 'ferry'::"HandoverCostType",
         rr."payload"->'handoverCosts'->'out'->>'ferryCost'
  FROM "RentRequests" rr
  WHERE rr."payload" IS NOT NULL

  UNION ALL
  SELECT rr."id", 'out'::"HandoverDirection", 'cleaning'::"HandoverCostType",
         rr."payload"->'handoverCosts'->'out'->>'cleaningCost'
  FROM "RentRequests" rr
  WHERE rr."payload" IS NOT NULL

  UNION ALL
  SELECT rr."id", 'in'::"HandoverDirection", 'fuel'::"HandoverCostType",
         rr."payload"->'handoverCosts'->'in'->>'fuelCost'
  FROM "RentRequests" rr
  WHERE rr."payload" IS NOT NULL

  UNION ALL
  SELECT rr."id", 'in'::"HandoverDirection", 'ferry'::"HandoverCostType",
         rr."payload"->'handoverCosts'->'in'->>'ferryCost'
  FROM "RentRequests" rr
  WHERE rr."payload" IS NOT NULL

  UNION ALL
  SELECT rr."id", 'in'::"HandoverDirection", 'cleaning'::"HandoverCostType",
         rr."payload"->'handoverCosts'->'in'->>'cleaningCost'
  FROM "RentRequests" rr
  WHERE rr."payload" IS NOT NULL
),
cleaned AS (
  SELECT
    booking_id,
    direction,
    cost_type,
    REGEXP_REPLACE(REPLACE(BTRIM(COALESCE(raw_value, '')), ',', '.'), '[^0-9\.-]', '', 'g') AS normalized
  FROM extracted
)
INSERT INTO "BookingHandoverCosts" ("bookingId", "direction", "costType", "amount", "updatedAt")
SELECT
  booking_id,
  direction,
  cost_type,
  CAST(normalized AS DECIMAL(12,2)) AS amount,
  timezone('utc'::text, now())
FROM cleaned
WHERE normalized ~ '^-?[0-9]+(\.[0-9]+)?$'
ON CONFLICT ("bookingId", "direction", "costType") DO UPDATE SET
  "amount" = EXCLUDED."amount",
  "updatedAt" = timezone('utc'::text, now());
