import { getCatalogData } from "../../../lib/data";
import { ProductionWizardForm } from "./wizard-form";

export default async function NewProductionPage() {
  const { products, fabrics, trims } = await getCatalogData();

  return (
    <section>
      <h2>Production Wizard</h2>
      <ProductionWizardForm
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        fabrics={fabrics.map((f) => ({ id: f.id, name: f.name, consumptionMts: f.consumptionMts, unitCost: f.unitCost }))}
        trims={trims.map((t) => ({ id: t.id, name: t.name, unitCost: t.unitCost }))}
      />
    </section>
  );
}
