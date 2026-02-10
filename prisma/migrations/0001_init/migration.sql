-- CreateTable
CREATE TABLE "Product" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "defaultConsumptionKg" REAL NOT NULL,
  "wastePct" REAL NOT NULL DEFAULT 0,
  "rollKg" REAL NOT NULL DEFAULT 25,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ProductionOrder" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "code" TEXT NOT NULL,
  "productId" INTEGER NOT NULL,
  "plannedUnits" INTEGER NOT NULL DEFAULT 0,
  "consumptionKgPerUnit" REAL NOT NULL,
  "wastePct" REAL NOT NULL,
  "rollKg" REAL NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "etaAt" DATETIME,
  "totalUnits" INTEGER NOT NULL DEFAULT 0,
  "kgNeeded" REAL NOT NULL DEFAULT 0,
  "rollsNeeded" INTEGER NOT NULL DEFAULT 0,
  "fabricCost" REAL NOT NULL DEFAULT 0,
  "processCost" REAL NOT NULL DEFAULT 0,
  "trimCost" REAL NOT NULL DEFAULT 0,
  "totalCost" REAL NOT NULL DEFAULT 0,
  "unitCost" REAL NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ProductionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProductionOrder_code_key" ON "ProductionOrder"("code");

CREATE TABLE "ProductionColorPlan" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "productionOrderId" INTEGER NOT NULL,
  "colorName" TEXT NOT NULL,
  "units" INTEGER NOT NULL,
  "kgRequired" REAL NOT NULL DEFAULT 0,
  CONSTRAINT "ProductionColorPlan_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CostProcessRate" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "unitCost" REAL NOT NULL,
  "vendor" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX "CostProcessRate_name_key" ON "CostProcessRate"("name");

CREATE TABLE "TrimItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "unitCost" REAL NOT NULL,
  "vendor" TEXT,
  "unitLabel" TEXT NOT NULL DEFAULT 'unit',
  "active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "ProductionTrimUsage" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "productionOrderId" INTEGER NOT NULL,
  "trimItemId" INTEGER NOT NULL,
  "qtyPerGarment" REAL NOT NULL,
  CONSTRAINT "ProductionTrimUsage_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductionTrimUsage_trimItemId_fkey" FOREIGN KEY ("trimItemId") REFERENCES "TrimItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProductionTrimUsage_productionOrderId_trimItemId_key" ON "ProductionTrimUsage"("productionOrderId", "trimItemId");

CREATE TABLE "FabricPrice" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "vendor" TEXT NOT NULL,
  "fabricType" TEXT NOT NULL,
  "pricePerKg" REAL NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true
);
