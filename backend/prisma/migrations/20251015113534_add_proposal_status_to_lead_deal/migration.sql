-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PREPARING', 'READY', 'SENT', 'FOR_REVISION', 'FINALIZED');

-- AlterTable
ALTER TABLE "LeadDeal" ADD COLUMN "proposalStatus" "ProposalStatus";
