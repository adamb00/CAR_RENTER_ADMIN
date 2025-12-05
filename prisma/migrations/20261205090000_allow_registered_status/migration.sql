-- Allow the admin "registered" status on RentRequests
DO $$
BEGIN
  IF to_regclass('"RentRequests"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "RentRequests" DROP CONSTRAINT IF EXISTS "RentRequests_status_check"';
  END IF;
END $$;
