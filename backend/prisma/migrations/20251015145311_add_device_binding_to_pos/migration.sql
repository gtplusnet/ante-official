-- Migration: Add device binding fields to POSDevice
-- This allows binding a POS device API key to a specific physical device

-- Add deviceFingerprint column (nullable for backward compatibility)
ALTER TABLE "POSDevice" ADD COLUMN "deviceFingerprint" TEXT;

-- Add boundAt timestamp
ALTER TABLE "POSDevice" ADD COLUMN "boundAt" TIMESTAMP(3);

-- Create index on deviceFingerprint for faster lookups
CREATE INDEX "POSDevice_deviceFingerprint_idx" ON "POSDevice"("deviceFingerprint");
