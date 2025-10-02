-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ScopeList" ADD VALUE 'SCHOOL_ACADEMIC_SETUP_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SCHOOL_YEAR_MANAGEMENT_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SCHOOL_GRADE_LEVEL_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SCHOOL_SECTION_MANAGEMENT_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SCHOOL_COURSE_MANAGEMENT_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SCHOOL_ACADEMIC_OPERATIONS_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SCHOOL_ENROLLMENT_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SCHOOL_ATTENDANCE_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SCHOOL_GRADING_ACCESS';
