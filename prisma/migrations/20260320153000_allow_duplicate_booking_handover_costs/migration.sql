DROP INDEX IF EXISTS "uniq_booking_handover_cost";

CREATE INDEX IF NOT EXISTS "idx_booking_handover_cost_lookup"
ON "BookingHandoverCosts"(
  "bookingId",
  "direction",
  "costType",
  "updatedAt",
  "createdAt"
);
