import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.costProcessRate.upsert({ where: { name: 'CUT' }, update: {}, create: { name: 'CUT', unitCost: 140 } });
  await prisma.costProcessRate.upsert({ where: { name: 'SEW' }, update: {}, create: { name: 'SEW', unitCost: 500 } });
  await prisma.costProcessRate.upsert({ where: { name: 'PRINT' }, update: {}, create: { name: 'PRINT', unitCost: 110 } });
  await prisma.costProcessRate.upsert({ where: { name: 'FINISH' }, update: {}, create: { name: 'FINISH', unitCost: 65 } });

  if (await prisma.product.count() === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Remera Basic', defaultConsumptionKg: 0.22, wastePct: 8, rollKg: 25, active: true },
        { name: 'Buzo Oversize', defaultConsumptionKg: 0.48, wastePct: 10, rollKg: 28, active: true }
      ]
    });
  }

  if (await prisma.trimItem.count() === 0) {
    await prisma.trimItem.createMany({
      data: [
        { name: 'Etiqueta marca', unitCost: 120, unitLabel: 'unit', vendor: 'Proveedor Y', active: true },
        { name: 'Bolsa', unitCost: 80, unitLabel: 'unit', vendor: 'Proveedor Pack', active: true }
      ]
    });
  }

  if (await prisma.fabricPrice.count() === 0) {
    await prisma.fabricPrice.createMany({
      data: [{ vendor: 'Proveedor X', fabricType: 'Jersey 24/1', pricePerKg: 6000, active: true }]
    });
  }

  if (await prisma.task.count() === 0) {
    await prisma.task.create({ data: { type: 'MANUAL', title: 'Revisar producción de la semana', priority: 'LOW' } });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
