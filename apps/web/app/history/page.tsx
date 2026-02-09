import { getProductions } from "../../lib/data";
import { CloseProductionForm } from "./ui";

export default async function HistoryPage() {
  const productions = await getProductions();
  const closed = productions.filter((p) => p.status === "DONE");
  const active = productions.filter((p) => p.status !== "DONE");

  return (
    <section>
      <h2>History</h2>

      <h3>Closed Productions</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
        <thead>
          <tr>
            <th>Code</th><th>Product</th><th>Planned Cost</th><th>Actual Cost</th><th>Planned Fabric</th><th>Actual Fabric</th>
          </tr>
        </thead>
        <tbody>
          {closed.map((p) => (
            <tr key={p.id}>
              <td>{p.code}</td>
              <td>{p.product.name}</td>
              <td>${p.plannedTotalCost.toFixed(2)}</td>
              <td>${p.actualTotalCost?.toFixed(2)}</td>
              <td>{p.plannedFabricMeters.toFixed(1)}m</td>
              <td>{p.actualFabricMeters?.toFixed(1)}m</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 20 }}>Close Active Production</h3>
      <CloseProductionForm
        productions={active.map((p) => ({ id: p.id, code: p.code, plannedTotalCost: p.plannedTotalCost, plannedFabricMeters: p.plannedFabricMeters }))}
      />
    </section>
  );
}
