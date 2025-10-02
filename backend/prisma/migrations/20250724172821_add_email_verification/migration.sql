-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "emailVerificationExpiry" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" VARCHAR(100),
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
