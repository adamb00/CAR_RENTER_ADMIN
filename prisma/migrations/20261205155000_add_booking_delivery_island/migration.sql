ALTER TABLE "BookingDeliveryDetails"
  ADD COLUMN IF NOT EXISTS "island" text;

UPDATE "BookingDeliveryDetails"
SET "island" = CASE
  WHEN UPPER(COALESCE("arrivalFlight", '') || ' ' || COALESCE("departureFlight", '')) ~ '(^|[^A-Z])ACE([^A-Z]|$)'
    THEN 'Lanzarote'
  WHEN UPPER(COALESCE("arrivalFlight", '') || ' ' || COALESCE("departureFlight", '')) ~ '(^|[^A-Z])FUE([^A-Z]|$)'
    THEN 'Fuerteventura'
  WHEN LOWER(COALESCE("locationName", '') || ' ' || COALESCE("addressLine", '')) LIKE ANY (ARRAY[
    '%lanzarote%',
    '%arrecife%',
    '%puerto del carmen%',
    '%costa teguise%',
    '%playa blanca%',
    '%yaiza%'
  ])
    THEN 'Lanzarote'
  WHEN LOWER(COALESCE("locationName", '') || ' ' || COALESCE("addressLine", '')) LIKE ANY (ARRAY[
    '%fuerteventura%',
    '%puerto del rosario%',
    '%corralejo%',
    '%caleta de fuste%',
    '%el castillo%',
    '%jandia%',
    '%morro jable%',
    '%costa calma%'
  ])
    THEN 'Fuerteventura'
  ELSE NULL
END
WHERE COALESCE(BTRIM("island"), '') = '';

CREATE INDEX IF NOT EXISTS "idx_booking_delivery_island"
  ON "BookingDeliveryDetails" ("island");
