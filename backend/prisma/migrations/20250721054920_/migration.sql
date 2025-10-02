-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "abc" DOUBLE PRECISION,
ADD COLUMN     "clientEmailAddress" TEXT,
ADD COLUMN     "contactDetails" TEXT,
ADD COLUMN     "initialCosting" DOUBLE PRECISION,
ADD COLUMN     "leadSource" TEXT,
ADD COLUMN     "leadType" TEXT,
ADD COLUMN     "mmr" DOUBLE PRECISION,
ADD COLUMN     "relationshipOwnerId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_relationshipOwnerId_fkey" FOREIGN KEY ("relationshipOwnerId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
