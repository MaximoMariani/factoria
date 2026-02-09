"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CloseProductionForm({
  productions,
}: {
  productions: { id: number; code: string; plannedTotalCost: number; plannedFabricMeters: number }[];
}) {
  const router = useRouter();
  const [productionId, setProductionId] = useState<number | "">(productions[0]?.id ?? "");
  const [actualTotalCost, setActualTotalCost] = useState("");
  const [actualFabricMeters, setActualFabricMeters] = useState("");

  async function submit() {
    if (!productionId) return;
    await fetch("/api/close-production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productionId, actualTotalCost: Number(actualTotalCost), actualFabricMeters: Number(actualFabricMeters) }),
    });
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
      <label>
        Production
        <select value={productionId} onChange={(e) => setProductionId(Number(e.target.value))}>
          {productions.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
        </select>
      </label>
      <label>
        Actual total cost
        <input value={actualTotalCost} onChange={(e) => setActualTotalCost(e.target.value)} placeholder="4200" />
      </label>
      <label>
        Actual fabric meters
        <input value={actualFabricMeters} onChange={(e) => setActualFabricMeters(e.target.value)} placeholder="550" />
      </label>
      <button onClick={submit}>Close Production</button>
    </div>
  );
}
