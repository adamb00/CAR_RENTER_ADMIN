ALTER TABLE "RentRequests"
  ADD COLUMN IF NOT EXISTS "assignedFleetVehicleId" text,
  ADD COLUMN IF NOT EXISTS "assignedFleetPlate" text;

UPDATE "RentRequests"
SET
  "assignedFleetVehicleId" = NULLIF(BTRIM("assignedFleetVehicleId"), ''),
  "assignedFleetPlate" = NULLIF(BTRIM("assignedFleetPlate"), '');

UPDATE "RentRequests"
SET
  "assignedFleetVehicleId" = NULLIF(BTRIM("payload" ->> 'assignedFleetVehicleId'), '')
WHERE
  NULLIF(BTRIM("assignedFleetVehicleId"), '') IS NULL;

UPDATE "RentRequests"
SET
  "assignedFleetPlate" = NULLIF(BTRIM("payload" ->> 'assignedFleetPlate'), '')
WHERE
  NULLIF(BTRIM("assignedFleetPlate"), '') IS NULL;

UPDATE "RentRequests"
SET
  "status" = 'registered',
  "updatedAt" = timezone('utc'::text, now())
WHERE
  NULLIF(BTRIM("assignedFleetVehicleId"), '') IS NOT NULL
  AND NULLIF(BTRIM("assignedFleetPlate"), '') IS NOT NULL
  AND "status" <> 'registered';

CREATE INDEX IF NOT EXISTS "idx_rentrequests_assigned_fleet_vehicle"
  ON "RentRequests" ("assignedFleetVehicleId");

ALTER TABLE "RentRequests"
  DROP CONSTRAINT IF EXISTS "RentRequests_assigned_fleet_status_check";

ALTER TABLE "RentRequests"
  ADD CONSTRAINT "RentRequests_assigned_fleet_status_check"
  CHECK (
    (
      NULLIF(BTRIM("assignedFleetVehicleId"), '') IS NULL
      AND NULLIF(BTRIM("assignedFleetPlate"), '') IS NULL
    )
    OR (
      NULLIF(BTRIM("assignedFleetVehicleId"), '') IS NOT NULL
      AND NULLIF(BTRIM("assignedFleetPlate"), '') IS NOT NULL
      AND "status" = 'registered'
    )
  );
