UPDATE "RentRequests"
SET
  "payload" = ("payload"::jsonb - 'assignedFleetVehicleId' - 'assignedFleetPlate'),
  "updatedAt" = timezone('utc'::text, now())
WHERE
  "payload" IS NOT NULL
  AND jsonb_typeof("payload"::jsonb) = 'object'
  AND (
    "payload"::jsonb ? 'assignedFleetVehicleId'
    OR "payload"::jsonb ? 'assignedFleetPlate'
  );
