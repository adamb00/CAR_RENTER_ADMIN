CREATE TABLE IF NOT EXISTS "BookingFleetAssignments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bookingId" UUID NOT NULL,
  "fleetVehicleId" TEXT NOT NULL,
  "slotIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT "BookingFleetAssignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BookingFleetAssignments_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "RentRequests"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BookingFleetAssignments_fleetVehicleId_fkey"
    FOREIGN KEY ("fleetVehicleId") REFERENCES "FleetVehicles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_booking_fleet_assignments_booking_slot"
  ON "BookingFleetAssignments"("bookingId", "slotIndex");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_booking_fleet_assignments_booking_vehicle"
  ON "BookingFleetAssignments"("bookingId", "fleetVehicleId");

CREATE INDEX IF NOT EXISTS "idx_booking_fleet_assignments_booking"
  ON "BookingFleetAssignments"("bookingId");

CREATE INDEX IF NOT EXISTS "idx_booking_fleet_assignments_vehicle"
  ON "BookingFleetAssignments"("fleetVehicleId");
