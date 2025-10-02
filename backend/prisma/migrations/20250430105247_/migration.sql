-- CreateTable
CREATE TABLE "EmployeeTimekeepingComputed" (
    "id" SERIAL NOT NULL,
    "workMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "undertimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightDifferentialMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightDifferentialOvertimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timekeepingId" INTEGER NOT NULL,

    CONSTRAINT "EmployeeTimekeepingComputed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EmployeeTimekeepingToEmployeeTimekeepingComputed" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTimekeepingComputed_timekeepingId_key" ON "EmployeeTimekeepingComputed"("timekeepingId");

-- CreateIndex
CREATE UNIQUE INDEX "_EmployeeTimekeepingToEmployeeTimekeepingComputed_AB_unique" ON "_EmployeeTimekeepingToEmployeeTimekeepingComputed"("A", "B");

-- CreateIndex
CREATE INDEX "_EmployeeTimekeepingToEmployeeTimekeepingComputed_B_index" ON "_EmployeeTimekeepingToEmployeeTimekeepingComputed"("B");

-- AddForeignKey
ALTER TABLE "_EmployeeTimekeepingToEmployeeTimekeepingComputed" ADD CONSTRAINT "_EmployeeTimekeepingToEmployeeTimekeepingComputed_A_fkey" FOREIGN KEY ("A") REFERENCES "EmployeeTimekeeping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmployeeTimekeepingToEmployeeTimekeepingComputed" ADD CONSTRAINT "_EmployeeTimekeepingToEmployeeTimekeepingComputed_B_fkey" FOREIGN KEY ("B") REFERENCES "EmployeeTimekeepingComputed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
