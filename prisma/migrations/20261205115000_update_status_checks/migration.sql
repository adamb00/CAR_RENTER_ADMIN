ALTER TABLE "ContactQuotes"
  DROP CONSTRAINT IF EXISTS "ContactQuotes_status_check";

ALTER TABLE "ContactQuotes"
  ADD CONSTRAINT "ContactQuotes_status_check"
  CHECK ("status" IN ('new', 'quote_sent', 'quote_accepted'));

ALTER TABLE "RentRequests"
  DROP CONSTRAINT IF EXISTS "RentRequests_status_check";

ALTER TABLE "RentRequests"
  ADD CONSTRAINT "RentRequests_status_check"
  CHECK (
    "status" IN (
      'new',
      'form_submitted',
      'accepted',
      'registered',
      'cancelled'
    )
  );
