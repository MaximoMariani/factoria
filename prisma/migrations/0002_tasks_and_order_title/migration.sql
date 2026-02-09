ALTER TABLE "ProductionOrder" ADD COLUMN "title" TEXT;

CREATE TABLE "Task" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "type" TEXT NOT NULL DEFAULT 'MANUAL',
  "title" TEXT NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "assignee" TEXT,
  "dueDate" DATETIME,
  "productionOrderId" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Task_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Task_type_productionOrderId_key" ON "Task"("type", "productionOrderId");
