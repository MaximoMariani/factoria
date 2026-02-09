import { PrismaClient, ProductionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.quantityItem.deleteMany();
  await prisma.production.deleteMany();
  await prisma.product.deleteMany();
  await prisma.fabric.deleteMany();
  await prisma.trim.deleteMany();
  await prisma.supplier.deleteMany();

  const [tee, hoodie] = await Promise.all([
    prisma.product.create({ data: { name: "Classic Tee", sku: "TEE-001" } }),
    prisma.product.create({ data: { name: "Essential Hoodie", sku: "HOO-001" } }),
  ]);

  await prisma.fabric.createMany({
    data: [
      { name: "Jersey 24/1", consumptionMts: 1.2, unitCost: 4.6 },
      { name: "Fleece 320gsm", consumptionMts: 1.8, unitCost: 7.8 },
    ],
  });

  await prisma.trim.createMany({
    data: [
      { name: "Main label", unitCost: 0.15 },
      { name: "Hangtag", unitCost: 0.2 },
      { name: "Drawcord", unitCost: 0.35 },
    ],
  });

  await prisma.supplier.createMany({
    data: [
      { name: "Andes Textiles", type: "Fabric Supplier" },
      { name: "Costura Norte", type: "Workshop" },
      { name: "Acabados Sur", type: "Workshop" },
    ],
  });

  const prod1 = await prisma.production.create({
    data: {
      code: "PRD-1001",
      productId: tee.id,
      status: ProductionStatus.DONE,
      plannedUnitCost: 8.4,
      actualUnitCost: 8.65,
      plannedFabricMeters: 360,
      actualFabricMeters: 372,
      plannedTotalCost: 2520,
      actualTotalCost: 2595,
      closedAt: new Date(),
      quantities: {
        create: [
          { color: "Black", size: "M", plannedQty: 150, actualQty: 148, productId: tee.id },
          { color: "Black", size: "L", plannedQty: 150, actualQty: 152, productId: tee.id },
        ],
      },
    },
  });

  await prisma.production.create({
    data: {
      code: "PRD-1002",
      productId: hoodie.id,
      status: ProductionStatus.IN_PROGRESS,
      plannedUnitCost: 13.2,
      plannedFabricMeters: 540,
      plannedTotalCost: 3960,
      quantities: {
        create: [
          { color: "Stone", size: "M", plannedQty: 120, productId: hoodie.id },
          { color: "Stone", size: "L", plannedQty: 180, productId: hoodie.id },
        ],
      },
    },
  });

  console.log(`Seeded with closed production ${prod1.code}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
