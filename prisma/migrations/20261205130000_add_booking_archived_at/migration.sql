ALTER TABLE "RentRequests"
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "idx_rentrequests_archived_at"
  ON "RentRequests"("archivedAt");
