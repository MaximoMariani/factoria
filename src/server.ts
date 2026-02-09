import express from "express";
import path from "node:path";
import { prisma } from "./prisma";
import { buildDraft, DraftInput, homeTodayDemo } from "./mock-data";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true });
});

app.get("/api/home/today", (_req, res) => {
  res.json(homeTodayDemo());
});

app.post("/api/production-orders/draft", (req, res) => {
  const input = req.body as DraftInput;

  if (!input?.productId || !Array.isArray(input.lineItems)) {
    return res.status(400).json({ ok: false, error: "productId y lineItems son requeridos" });
  }

  const draft = buildDraft(input);
  return res.json({ ok: true, draft });
});

app.post("/api/production-orders", (req, res) => {
  const body = req.body;
  const id = `op-${Date.now()}`;

  res.status(201).json({
    ok: true,
    message: "Orden de producción creada (simulada)",
    order: {
      id,
      code: body?.code ?? `OP-${new Date().getTime().toString().slice(-5)}`,
      status: "PLANNED"
    }
  });
});

app.post("/api/production-orders/:id/start", (req, res) => {
  const { id } = req.params;
  res.json({
    ok: true,
    message: `Orden ${id} iniciada (simulada)`,
    status: "CUTTING",
    startedAt: new Date().toISOString()
  });
});

app.post("/api/production-orders/:id/checklist", (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  res.json({
    ok: true,
    message: `Checklist actualizado para ${id} (simulado)`,
    checklist: {
      productionOrderId: id,
      key: payload?.key ?? "FABRIC_PURCHASED",
      checked: Boolean(payload?.checked),
      checkedBy: payload?.checkedBy ?? "system",
      checkedAt: new Date().toISOString()
    }
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});

app.listen(port, () => {
  console.log(`MVP corriendo en http://localhost:${port}`);
});
