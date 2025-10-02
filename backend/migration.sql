-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_sectionId_fkey";

-- DropIndex
DROP INDEX "idx_account_supabase_user";

-- DropIndex
DROP INDEX "idx_employee_company_active";

-- DropIndex
DROP INDEX "idx_employee_created";

-- DropIndex
DROP INDEX "SchoolSection_name_gradeLevelId_schoolYear_companyId_key";

-- DropIndex
DROP INDEX "Student_sectionId_idx";

-- AlterTable
ALTER TABLE "Files" ALTER COLUMN "uploadedById" SET NOT NULL;

-- AlterTable
ALTER TABLE "SchoolSection" ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "adviserName" DROP NOT NULL,
ALTER COLUMN "adviserName" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "schoolYear" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "capacity" SET DEFAULT 30,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "sectionId";

-- CreateIndex
CREATE INDEX "idx_student_is_active" ON "Student"("isActive" ASC);

-- CreateIndex
CREATE INDEX "idx_guardian_is_active" ON "Guardian"("isActive" ASC);

-- CreateIndex
CREATE INDEX "idx_student_guardian_guardian_id" ON "StudentGuardian"("guardianId" ASC);

-- CreateIndex
CREATE INDEX "idx_student_guardian_student_id" ON "StudentGuardian"("studentId" ASC);

-- CreateIndex
CREATE INDEX "idx_school_attendance_company_id" ON "SchoolAttendance"("companyId" ASC);

-- CreateIndex
CREATE INDEX "idx_school_attendance_person_type" ON "SchoolAttendance"("personType" ASC);

-- CreateIndex
CREATE INDEX "idx_school_attendance_timestamp" ON "SchoolAttendance"("timestamp" ASC);

-- CreateIndex
CREATE INDEX "idx_guardian_notification_guardian_id" ON "GuardianNotification"("guardianId" ASC);

-- CreateIndex
CREATE INDEX "idx_guardian_notification_read_at" ON "GuardianNotification"("readAt" ASC);

-- CreateIndex
CREATE INDEX "idx_school_notification_guardian_id" ON "SchoolNotification"("guardianId" ASC);

-- CreateIndex
CREATE INDEX "idx_school_notification_read" ON "SchoolNotification"("read" ASC);

-- CreateIndex
CREATE INDEX "idx_school_notification_timestamp" ON "SchoolNotification"("timestamp" ASC);

