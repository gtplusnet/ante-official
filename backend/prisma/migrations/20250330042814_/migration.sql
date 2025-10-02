-- CreateEnum
CREATE TYPE "QueueType" AS ENUM ('EMPLOYEE_IMPORTATION', 'TIMEKEEPING_PROCESSING');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Queue" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "QueueType" NOT NULL,
    "completePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "processPerBatch" INTEGER NOT NULL DEFAULT 10,
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "errorStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueLogs" (
    "id" SERIAL NOT NULL,
    "queueId" INTEGER NOT NULL,
    "isError" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeImportation" (
    "id" SERIAL NOT NULL,
    "queueId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeImportation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeImportation_queueId_key" ON "EmployeeImportation"("queueId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeImportation_fileId_key" ON "EmployeeImportation"("fileId");

-- AddForeignKey
ALTER TABLE "QueueLogs" ADD CONSTRAINT "QueueLogs_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeImportation" ADD CONSTRAINT "EmployeeImportation_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeImportation" ADD CONSTRAINT "EmployeeImportation_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
