-- CreateEnum
CREATE TYPE "BoqType" AS ENUM ('HEADING', 'SUBHEADING', 'ITEM', 'SUBITEM', 'DETAILITEM');

-- CreateTable
CREATE TABLE "BillOfQuantity" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "contractLocation" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalMaterialCost" DOUBLE PRECISION,
    "totalLaborCost" DOUBLE PRECISION,
    "totalDirectCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "BillOfQuantity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillOfQuantityTable" (
    "id" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "type" "BoqType" NOT NULL,
    "order" INTEGER NOT NULL,
    "particulars" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "materialUnitCost" DOUBLE PRECISION,
    "materialTotalCost" DOUBLE PRECISION,
    "laborUnitCost" DOUBLE PRECISION,
    "laborTotalCost" DOUBLE PRECISION,
    "directCost" DOUBLE PRECISION,
    "subtotal" DOUBLE PRECISION,
    "parentId" TEXT,
    "billOfQuantityId" TEXT,
    "itemId" TEXT,

    CONSTRAINT "BillOfQuantityTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillOfQuantity_id_key" ON "BillOfQuantity"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BillOfQuantity_contractId_key" ON "BillOfQuantity"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "BillOfQuantityTable_id_key" ON "BillOfQuantityTable"("id");

-- AddForeignKey
ALTER TABLE "BillOfQuantity" ADD CONSTRAINT "BillOfQuantity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantityTable" ADD CONSTRAINT "BillOfQuantityTable_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BillOfQuantityTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantityTable" ADD CONSTRAINT "BillOfQuantityTable_billOfQuantityId_fkey" FOREIGN KEY ("billOfQuantityId") REFERENCES "BillOfQuantity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantityTable" ADD CONSTRAINT "BillOfQuantityTable_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
