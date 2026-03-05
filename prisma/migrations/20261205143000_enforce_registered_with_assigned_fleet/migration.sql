ALTER TABLE "RentRequests"
  DROP CONSTRAINT IF EXISTS "RentRequests_assigned_fleet_status_check";

UPDATE "RentRequests"
SET
  "status" = 'registered',
  "updatedAt" = timezone('utc'::text, now())
WHERE
  NULLIF(BTRIM("payload" ->> 'assignedFleetVehicleId'), '') IS NOT NULL
  AND NULLIF(BTRIM("payload" ->> 'assignedFleetPlate'), '') IS NOT NULL
  AND "status" <> 'registered';

ALTER TABLE "RentRequests"
  ADD CONSTRAINT "RentRequests_assigned_fleet_status_check"
  CHECK (
    (
      NULLIF(BTRIM("payload" ->> 'assignedFleetVehicleId'), '') IS NULL
      OR NULLIF(BTRIM("payload" ->> 'assignedFleetPlate'), '') IS NULL
    )
    OR "status" = 'registered'
  );
