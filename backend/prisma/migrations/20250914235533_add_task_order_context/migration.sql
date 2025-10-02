-- CreateTable
CREATE TABLE "TaskOrderContext" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "taskId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "viewType" TEXT NOT NULL,
    "groupingMode" TEXT NOT NULL,
    "groupingValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskOrderContext_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskOrderContext_userId_taskId_viewType_groupingMode_groupingValue_key" ON "TaskOrderContext"("userId", "taskId", "viewType", "groupingMode", "groupingValue");

-- CreateIndex
CREATE UNIQUE INDEX "TaskOrderContext_taskId_viewType_groupingMode_groupingValue_key" ON "TaskOrderContext"("taskId", "viewType", "groupingMode", "groupingValue");

-- CreateIndex
CREATE INDEX "TaskOrderContext_userId_viewType_groupingMode_groupingValue_orderIndex_idx" ON "TaskOrderContext"("userId", "viewType", "groupingMode", "groupingValue", "orderIndex");

-- CreateIndex
CREATE INDEX "TaskOrderContext_viewType_groupingMode_groupingValue_orderIndex_idx" ON "TaskOrderContext"("viewType", "groupingMode", "groupingValue", "orderIndex");

-- AddForeignKey
ALTER TABLE "TaskOrderContext" ADD CONSTRAINT "TaskOrderContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrderContext" ADD CONSTRAINT "TaskOrderContext_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;