export type DraftInput = {
  productId: string;
  lineItems: Array<{
    color: string;
    size?: string;
    quantity: number;
    consumptionKg: number;
  }>;
  wastePct?: number;
  fabricItemId?: string;
};

export function buildDraft(input: DraftInput) {
  const wastePct = input.wastePct ?? 5;
  const totalUnits = input.lineItems.reduce((acc, item) => acc + item.quantity, 0);
  const kgByColor = input.lineItems.map((item) => ({
    color: item.color,
    units: item.quantity,
    kg: Number((item.quantity * item.consumptionKg * (1 + wastePct / 100)).toFixed(2))
  }));
  const kgTotal = Number(kgByColor.reduce((acc, item) => acc + item.kg, 0).toFixed(2));

  const fabricCost = Number((kgTotal * 6400).toFixed(2));
  const processCost = Number((totalUnits * 900).toFixed(2));
  const trimCost = Number((totalUnits * 200).toFixed(2));
  const totalCost = Number((fabricCost + processCost + trimCost).toFixed(2));

  return {
    productId: input.productId,
    fabricItemId: input.fabricItemId ?? null,
    wastePct,
    totalUnits,
    kgByColor,
    kgTotal,
    fabricCost,
    processCost,
    trimCost,
    totalCost,
    unitCost: totalUnits > 0 ? Number((totalCost / totalUnits).toFixed(2)) : 0
  };
}

export function homeTodayDemo() {
  return {
    inProgress: [
      { id: "op-001", code: "OP-001", product: "Remera básica", status: "CUTTING", progress: 25 },
      { id: "op-002", code: "OP-002", product: "Buzo frisa", status: "SEWING", progress: 60 }
    ],
    nextPlanned: [
      { id: "op-003", code: "OP-003", product: "Jogger", etaAt: "2026-03-10" },
      { id: "op-004", code: "OP-004", product: "Campera", etaAt: "2026-03-12" }
    ],
    pendingActions: [
      { type: "PURCHASE", description: "Comprar 120kg de algodón peinado" },
      { type: "CHECKLIST", description: "Confirmar avíos OP-002" }
    ]
  };
}
