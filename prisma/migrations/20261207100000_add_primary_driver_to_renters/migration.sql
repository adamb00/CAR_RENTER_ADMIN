ALTER TABLE "Renters"
ADD COLUMN "primaryDriver" JSONB;

WITH renter_driver_seed AS (
  SELECT DISTINCT ON (rr."renterId")
    rr."renterId" AS renter_id,
    CASE
      WHEN jsonb_typeof(rr."payload"::jsonb -> 'driver') = 'array'
        THEN rr."payload"::jsonb -> 'driver' -> 0
      WHEN jsonb_typeof(rr."payload"::jsonb -> 'driver') = 'object'
        THEN rr."payload"::jsonb -> 'driver'
      ELSE NULL
    END AS primary_driver
  FROM "RentRequests" rr
  WHERE rr."renterId" IS NOT NULL
    AND rr."payload" IS NOT NULL
    AND (
      jsonb_typeof(rr."payload"::jsonb -> 'driver') = 'array' OR
      jsonb_typeof(rr."payload"::jsonb -> 'driver') = 'object'
    )
  ORDER BY
    rr."renterId",
    COALESCE(rr."updatedAt", rr."createdAt") DESC,
    rr."id" DESC
)
UPDATE "Renters" r
SET
  "primaryDriver" = seed.primary_driver,
  "updatedAt" = timezone('utc'::text, now())
FROM renter_driver_seed seed
WHERE r."id" = seed.renter_id
  AND seed.primary_driver IS NOT NULL;
