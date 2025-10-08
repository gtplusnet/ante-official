-- Add geolocation tracking fields to EmployeeTimekeepingRaw

-- TIME-IN fields
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "timeInLatitude" DOUBLE PRECISION;
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "timeInLongitude" DOUBLE PRECISION;
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "timeInLocation" TEXT;
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "timeInIpAddress" TEXT;
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "timeInGeolocationEnabled" BOOLEAN;

-- TIME-OUT fields
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "timeOutLatitude" DOUBLE PRECISION;
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "timeOutLongitude" DOUBLE PRECISION;
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "timeOutLocation" TEXT;
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "timeOutIpAddress" TEXT;
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "timeOutGeolocationEnabled" BOOLEAN;

-- Create indexes for location-based queries
CREATE INDEX "EmployeeTimekeepingRaw_accountId_timeInLocation_idx" ON "EmployeeTimekeepingRaw"("accountId", "timeInLocation");
CREATE INDEX "EmployeeTimekeepingRaw_accountId_timeOutLocation_idx" ON "EmployeeTimekeepingRaw"("accountId", "timeOutLocation");
