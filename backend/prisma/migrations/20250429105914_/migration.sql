-- CreateTable
CREATE TABLE "EmployeeTimekeepingHoliday" (
    "id" SERIAL NOT NULL,
    "timekeepingId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "holidayType" "HolidayType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeTimekeepingHoliday_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingHoliday" ADD CONSTRAINT "EmployeeTimekeepingHoliday_timekeepingId_fkey" FOREIGN KEY ("timekeepingId") REFERENCES "EmployeeTimekeeping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
