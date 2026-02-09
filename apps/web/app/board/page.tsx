import { ProductionStatus } from "@prisma/client";
import { getProductions } from "../../lib/data";

export default async function BoardPage() {
  const productions = await getProductions();
  const statuses: ProductionStatus[] = ["PLANNED", "IN_PROGRESS", "DONE"];

  return (
    <section>
      <h2>Production Board</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {statuses.map((status) => (
          <div key={status} style={{ background: "white", borderRadius: 8, padding: 12 }}>
            <h3>{status.replace("_", " ")}</h3>
            {productions
              .filter((p) => p.status === status)
              .map((p) => (
                <article key={p.id} style={{ border: "1px solid #eee", padding: 10, borderRadius: 6, marginBottom: 8 }}>
                  <strong>{p.code}</strong>
                  <p style={{ margin: "8px 0" }}>{p.product.name}</p>
                  <small>Planned total: ${p.plannedTotalCost.toFixed(2)}</small>
                </article>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
