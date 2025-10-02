-- AddForeignKey
ALTER TABLE "BillOfQuantityTable" ADD CONSTRAINT "BillOfQuantityTable_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BillOfQuantityTable"("key") ON DELETE CASCADE ON UPDATE CASCADE;
