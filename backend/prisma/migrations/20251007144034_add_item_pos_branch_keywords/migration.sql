-- AlterTable: Add branchId and enabledInPOS to Item
ALTER TABLE "Item" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "Item" ADD COLUMN "enabledInPOS" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: Keyword
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "keywordValue" TEXT NOT NULL,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ItemKeyword
CREATE TABLE "ItemKeyword" (
    "itemId" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,

    CONSTRAINT "ItemKeyword_pkey" PRIMARY KEY ("itemId","keywordId")
);

-- AddForeignKey
ALTER TABLE "ItemKeyword" ADD CONSTRAINT "ItemKeyword_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemKeyword" ADD CONSTRAINT "ItemKeyword_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;
