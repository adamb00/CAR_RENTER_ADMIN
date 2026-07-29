CREATE TABLE "Audit" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "field" TEXT,
  "oldValue" JSONB,
  "newValue" JSONB,
  "metadata" JSONB,
  "actorId" TEXT,
  "actorName" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_audit_entity" ON "Audit"("entityType", "entityId");
CREATE INDEX "idx_audit_created_at" ON "Audit"("createdAt");
