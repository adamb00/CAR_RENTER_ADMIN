DO $$
BEGIN
  ALTER TYPE "HandoverCostType" ADD VALUE IF NOT EXISTS 'commission';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
