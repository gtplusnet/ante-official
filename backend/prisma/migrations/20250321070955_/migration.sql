-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "scheduleCode" TEXT NOT NULL,
    "mondayShiftId" INTEGER NOT NULL,
    "tuesdayShiftId" INTEGER NOT NULL,
    "wednesdayShiftId" INTEGER NOT NULL,
    "thursdayShiftId" INTEGER NOT NULL,
    "fridayShiftId" INTEGER NOT NULL,
    "saturdayShiftId" INTEGER NOT NULL,
    "sundayShiftId" INTEGER NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_mondayShiftId_fkey" FOREIGN KEY ("mondayShiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_tuesdayShiftId_fkey" FOREIGN KEY ("tuesdayShiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_wednesdayShiftId_fkey" FOREIGN KEY ("wednesdayShiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_thursdayShiftId_fkey" FOREIGN KEY ("thursdayShiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_fridayShiftId_fkey" FOREIGN KEY ("fridayShiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_saturdayShiftId_fkey" FOREIGN KEY ("saturdayShiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_sundayShiftId_fkey" FOREIGN KEY ("sundayShiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
