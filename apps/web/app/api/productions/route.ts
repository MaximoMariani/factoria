import { prisma } from "@factoria/db/src/client";
import { ProductionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const latest = await prisma.production.findFirst({ orderBy: { id: "desc" } });
  const nextCode = `PRD-${1000 + (latest?.id ?? 0) + 1}`;

  const production = await prisma.production.create({
    data: {
      code: nextCode,
      productId: body.productId,
      status: ProductionStatus.PLANNED,
      plannedUnitCost: body.plannedUnitCost,
      plannedFabricMeters: body.plannedFabricMeters,
      plannedTotalCost: body.plannedTotalCost,
      quantities: {
        create: body.rows.map((r: { color: string; size: string; plannedQty: number }) => ({
          ...r,
          productId: body.productId,
        })),
      },
    },
  });

  return NextResponse.json({ id: production.id, code: production.code });
}
