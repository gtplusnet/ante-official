-- CreateTable
CREATE TABLE "EmployeeTimekeeping" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "workMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateUndertimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightDifferentialMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightDifferentialOvertimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeTimekeeping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTimekeepingLogs" (
    "id" SERIAL NOT NULL,
    "timekeepingId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeIn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeTimekeepingLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTimekeepingRaw" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "timeIn" TIMESTAMP(3) NOT NULL,
    "timeOut" TIMESTAMP(3) NOT NULL,
    "timeSpan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeTimekeepingRaw_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmployeeTimekeeping" ADD CONSTRAINT "EmployeeTimekeeping_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingLogs" ADD CONSTRAINT "EmployeeTimekeepingLogs_timekeepingId_fkey" FOREIGN KEY ("timekeepingId") REFERENCES "EmployeeTimekeeping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingRaw" ADD CONSTRAINT "EmployeeTimekeepingRaw_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
