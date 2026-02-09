"use client";

import { useMemo, useState } from "react";

type Props = {
  products: { id: number; name: string }[];
  fabrics: { id: number; name: string; consumptionMts: number; unitCost: number }[];
  trims: { id: number; name: string; unitCost: number }[];
};

export function ProductionWizardForm({ products, fabrics, trims }: Props) {
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  const [fabricId, setFabricId] = useState(fabrics[0]?.id ?? 0);
  const [qty1, setQty1] = useState(100);
  const [qty2, setQty2] = useState(100);

  const selectedFabric = fabrics.find((f) => f.id === fabricId)!;
  const totalQty = qty1 + qty2;

  const calc = useMemo(() => {
    const plannedFabricMeters = totalQty * selectedFabric.consumptionMts;
    const fabricCost = plannedFabricMeters * selectedFabric.unitCost;
    const trimsCost = totalQty * trims.reduce((acc, t) => acc + t.unitCost, 0);
    const processCost = totalQty * 2.5;
    const plannedTotalCost = fabricCost + trimsCost + processCost;
    const plannedUnitCost = plannedTotalCost / totalQty;
    return { plannedFabricMeters, plannedTotalCost, plannedUnitCost, fabricCost, trimsCost, processCost };
  }, [totalQty, selectedFabric, trims]);

  async function createProduction() {
    await fetch("/api/productions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        fabricId,
        rows: [
          { color: "Black", size: "M", plannedQty: qty1 },
          { color: "Black", size: "L", plannedQty: qty2 },
        ],
        ...calc,
      }),
    });
    alert("Production created");
  }

  return (
    <div style={{ background: "white", padding: 16, borderRadius: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label>Product
          <select value={productId} onChange={(e) => setProductId(Number(e.target.value))}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label>Fabric
          <select value={fabricId} onChange={(e) => setFabricId(Number(e.target.value))}>
            {fabrics.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
        <label>Black / M qty<input type="number" value={qty1} onChange={(e) => setQty1(Number(e.target.value))} /></label>
        <label>Black / L qty<input type="number" value={qty2} onChange={(e) => setQty2(Number(e.target.value))} /></label>
      </div>

      <h3>Cost Summary (Planned)</h3>
      <ul>
        <li>Total quantity: {totalQty}</li>
        <li>Fabric purchase: {calc.plannedFabricMeters.toFixed(1)} meters</li>
        <li>Fabric cost: ${calc.fabricCost.toFixed(2)}</li>
        <li>Trims cost: ${calc.trimsCost.toFixed(2)}</li>
        <li>Process cost: ${calc.processCost.toFixed(2)}</li>
        <li><strong>Unit cost: ${calc.plannedUnitCost.toFixed(2)}</strong></li>
        <li><strong>Total cost: ${calc.plannedTotalCost.toFixed(2)}</strong></li>
      </ul>

      <button onClick={createProduction}>Create Production</button>
    </div>
  );
}
