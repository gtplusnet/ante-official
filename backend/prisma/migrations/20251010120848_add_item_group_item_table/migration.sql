-- CreateTable
CREATE TABLE "ItemGroupItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemGroupItem_groupId_idx" ON "ItemGroupItem"("groupId");

-- CreateIndex
CREATE INDEX "ItemGroupItem_itemId_idx" ON "ItemGroupItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemGroupItem_groupId_itemId_key" ON "ItemGroupItem"("groupId", "itemId");

-- AddForeignKey
ALTER TABLE "ItemGroupItem" ADD CONSTRAINT "ItemGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemGroupItem" ADD CONSTRAINT "ItemGroupItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
