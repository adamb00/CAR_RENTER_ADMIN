CREATE TABLE "BookingContractInvites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "signerName" TEXT,
    "locale" TEXT,
    "contractVersion" TEXT NOT NULL DEFAULT 'v1',
    "contractText" TEXT NOT NULL,
    "lessorSignatureData" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingContractInvites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingContractInvites_tokenHash_key" ON "BookingContractInvites"("tokenHash");
CREATE INDEX "BookingContractInvites_bookingId_idx" ON "BookingContractInvites"("bookingId");
CREATE INDEX "BookingContractInvites_bookingId_completedAt_revokedAt_expiresAt_idx" ON "BookingContractInvites"("bookingId", "completedAt", "revokedAt", "expiresAt");

ALTER TABLE "BookingContractInvites"
ADD CONSTRAINT "BookingContractInvites_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "RentRequests"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
