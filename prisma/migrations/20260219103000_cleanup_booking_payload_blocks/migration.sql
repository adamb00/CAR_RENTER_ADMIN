-- Remove normalized booking blocks from payload after table migration.
-- Safe to run after BookingPricingSnapshots / BookingDeliveryDetails / BookingHandoverCosts are populated.
UPDATE "RentRequests"
SET "payload" =
  COALESCE("payload"::jsonb, '{}'::jsonb)
  - 'pricing'
  - 'delivery'
  - 'handoverTip'
  - 'handoverCosts',
    "updatedAt" = timezone('utc'::text, now())
WHERE "payload" IS NOT NULL;
