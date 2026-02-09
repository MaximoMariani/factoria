import { Card } from "@factoria/ui/src";
import { getCatalogData } from "../../lib/data";

export default async function CatalogPage() {
  const { products, fabrics, trims, suppliers } = await getCatalogData();

  return (
    <section>
      <h2>Catalog</h2>
      <Card title="Products">
        <ul>{products.map((p) => <li key={p.id}>{p.name} ({p.sku})</li>)}</ul>
      </Card>
      <Card title="Fabrics">
        <ul>{fabrics.map((f) => <li key={f.id}>{f.name} · {f.consumptionMts}m · ${f.unitCost.toFixed(2)}</li>)}</ul>
      </Card>
      <Card title="Trims (Avíos)">
        <ul>{trims.map((t) => <li key={t.id}>{t.name} · ${t.unitCost.toFixed(2)}</li>)}</ul>
      </Card>
      <Card title="Suppliers & Workshops">
        <ul>{suppliers.map((s) => <li key={s.id}>{s.name} · {s.type}</li>)}</ul>
      </Card>
    </section>
  );
}
