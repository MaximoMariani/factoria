import { prisma } from "@factoria/db/src/client";
import { ProductionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { productionId, actualTotalCost, actualFabricMeters } = await request.json();

  const updated = await prisma.production.update({
    where: { id: Number(productionId) },
    data: {
      status: ProductionStatus.DONE,
      actualTotalCost,
      actualFabricMeters,
      actualUnitCost: actualTotalCost > 0 ? actualTotalCost / (await getPlannedQty(Number(productionId))) : null,
      closedAt: new Date(),
    },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}

async function getPlannedQty(productionId: number) {
  const rows = await prisma.quantityItem.findMany({ where: { productionId } });
  return rows.reduce((acc, r) => acc + r.plannedQty, 0);
}
