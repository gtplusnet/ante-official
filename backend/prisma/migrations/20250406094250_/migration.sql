-- CreateTable
CREATE TABLE "EmployeeTimekeepingCutoff" (
    "id" SERIAL NOT NULL,
    "cutoffId" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "dateRangeCode" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeTimekeepingCutoff_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingCutoff" ADD CONSTRAINT "EmployeeTimekeepingCutoff_cutoffId_fkey" FOREIGN KEY ("cutoffId") REFERENCES "Cutoff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingCutoff" ADD CONSTRAINT "EmployeeTimekeepingCutoff_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
