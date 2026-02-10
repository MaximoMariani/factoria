import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const ok = (res, data) => res.json(data);
const bad = (res, msg) => res.status(400).json({ error: msg });
const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const nonNegative = (v) => Number.isFinite(Number(v)) && Number(v) >= 0;

async function ensureAutoTask({ type, title, priority, productionOrderId }) {
  return prisma.task.upsert({
    where: { type_productionOrderId: { type, productionOrderId } },
    update: { title, priority, done: false },
    create: { type, title, priority, productionOrderId, done: false }
  });
}

async function syncAutoTasks(order) {
  const shouldFabric = order.kgNeeded > 0 && order.fabricCost === 0;
  const shouldTrim = order.totalUnits > 0 && order.trimCost === 0;
  const shouldPayment = order.status === 'RUNNING' && order.processCost > 0;

  if (shouldFabric) await ensureAutoTask({ type: 'AUTO_FABRIC', title: `Comprar tela para ${order.code}`, priority: 'HIGH', productionOrderId: order.id });
  if (shouldTrim) await ensureAutoTask({ type: 'AUTO_TRIMS', title: `Pedir avíos para ${order.code}`, priority: 'MEDIUM', productionOrderId: order.id });
  if (shouldPayment) await ensureAutoTask({ type: 'AUTO_PAYMENT', title: `Confirmar pago confección para ${order.code}`, priority: 'HIGH', productionOrderId: order.id });
}

async function computeProduction(orderId) {
  const order = await prisma.productionOrder.findUnique({
    where: { id: orderId },
    include: { colorPlans: true, trimUsages: { include: { trimItem: true } } }
  });
  if (!order) return null;

  const processRates = await prisma.costProcessRate.findMany({ where: { active: true } });
  const fabric = await prisma.fabricPrice.findFirst({ where: { active: true }, orderBy: { id: 'desc' } });

  const totalUnits = order.colorPlans.length ? order.colorPlans.reduce((a, c) => a + c.units, 0) : order.plannedUnits;
  const kgNeeded = round2(totalUnits * order.consumptionKgPerUnit * (1 + order.wastePct / 100));
  const rollsNeeded = order.rollKg > 0 ? Math.ceil(kgNeeded / order.rollKg) : 0;

  for (const c of order.colorPlans) {
    const share = totalUnits > 0 ? c.units / totalUnits : 0;
    await prisma.productionColorPlan.update({ where: { id: c.id }, data: { kgRequired: round2(kgNeeded * share) } });
  }

  const fabricCost = round2(kgNeeded * (fabric?.pricePerKg || 0));
  const processCost = round2(processRates.reduce((acc, r) => acc + totalUnits * r.unitCost, 0));
  const trimCost = round2(order.trimUsages.reduce((acc, t) => acc + totalUnits * t.qtyPerGarment * t.trimItem.unitCost, 0));
  const totalCost = round2(fabricCost + processCost + trimCost);
  const unitCost = totalUnits > 0 ? round2(totalCost / totalUnits) : 0;

  const updated = await prisma.productionOrder.update({
    where: { id: order.id },
    data: { totalUnits, kgNeeded, rollsNeeded, fabricCost, processCost, trimCost, totalCost, unitCost }
  });

  await syncAutoTasks(updated);
  return updated;
}

app.get(['/','/dashboard','/productions','/products','/costs'], (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.get('/api/dashboard', async (_, res) => {
  const inProgress = await prisma.productionOrder.findMany({ where: { status: 'RUNNING' }, include: { product: true }, take: 5, orderBy: { updatedAt: 'desc' } });
  const nextPlanned = await prisma.productionOrder.findMany({ where: { status: 'PLANNED' }, include: { product: true }, take: 3, orderBy: { createdAt: 'desc' } });
  const tasks = await prisma.task.findMany({ where: { done: false }, include: { productionOrder: { include: { product: true } } }, orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }] });
  ok(res, { inProgress, nextPlanned, tasks });
});

app.get('/api/tasks', async (req, res) => {
  const filter = (req.query.filter || 'ALL').toString();
  const where = filter === 'PENDING' ? { done: false } : filter === 'DONE' ? { done: true } : {};
  ok(res, await prisma.task.findMany({ where, include: { productionOrder: true }, orderBy: [{ done: 'asc' }, { createdAt: 'desc' }] }));
});

app.post('/api/tasks', async (req, res) => {
  const b = req.body;
  if (!isNonEmpty(b.title)) return bad(res, 'Título de tarea requerido.');
  const task = await prisma.task.create({
    data: {
      title: b.title.trim(),
      done: !!b.done,
      priority: ['HIGH', 'MEDIUM', 'LOW'].includes(b.priority) ? b.priority : 'MEDIUM',
      assignee: isNonEmpty(b.assignee) ? b.assignee.trim() : null,
      dueDate: b.dueDate ? new Date(b.dueDate) : null,
      productionOrderId: b.productionOrderId ? Number(b.productionOrderId) : null,
      type: 'MANUAL'
    }
  });
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', async (req, res) => {
  const b = req.body;
  const data = {};
  if (b.title !== undefined) {
    if (!isNonEmpty(b.title)) return bad(res, 'Título no puede ser vacío.');
    data.title = b.title.trim();
  }
  if (b.done !== undefined) data.done = !!b.done;
  if (b.priority !== undefined) {
    if (!['HIGH', 'MEDIUM', 'LOW'].includes(b.priority)) return bad(res, 'Prioridad inválida.');
    data.priority = b.priority;
  }
  if (b.assignee !== undefined) data.assignee = isNonEmpty(b.assignee) ? b.assignee.trim() : null;
  if (b.dueDate !== undefined) data.dueDate = b.dueDate ? new Date(b.dueDate) : null;
  ok(res, await prisma.task.update({ where: { id: Number(req.params.id) }, data }));
});

app.delete('/api/tasks/:id', async (req, res) => {
  await prisma.task.delete({ where: { id: Number(req.params.id) } });
  ok(res, { ok: true });
});

app.get('/api/productions', async (req, res) => {
  const status = req.query.status?.toString();
  const where = status && status !== 'ALL' ? { status } : {};
  ok(res, await prisma.productionOrder.findMany({ where, include: { product: true, colorPlans: true }, orderBy: { createdAt: 'desc' } }));
});

app.post('/api/productions', async (req, res) => {
  const b = req.body;
  if (!nonNegative(b.plannedUnits || 0) || !nonNegative(b.consumptionKgPerUnit) || !nonNegative(b.wastePct) || !nonNegative(b.rollKg)) return bad(res, 'Valores numéricos inválidos.');

  const code = `OP-${Date.now().toString().slice(-6)}`;
  const colorPlans = Array.isArray(b.colorPlans) ? b.colorPlans.filter((c) => isNonEmpty(c.colorName) && nonNegative(c.units)) : [];
  const trimUsages = Array.isArray(b.trimUsages) ? b.trimUsages.filter((t) => nonNegative(t.qtyPerGarment)) : [];

  const created = await prisma.productionOrder.create({
    data: {
      code,
      title: isNonEmpty(b.title) ? b.title.trim() : null,
      productId: Number(b.productId),
      plannedUnits: Number(b.plannedUnits || 0),
      consumptionKgPerUnit: Number(b.consumptionKgPerUnit),
      wastePct: Number(b.wastePct),
      rollKg: Number(b.rollKg),
      status: b.status || 'PLANNED',
      etaAt: b.etaAt ? new Date(b.etaAt) : null,
      colorPlans: { create: colorPlans.map((c) => ({ colorName: c.colorName.trim(), units: Number(c.units) })) },
      trimUsages: { create: trimUsages.map((t) => ({ trimItemId: Number(t.trimItemId), qtyPerGarment: Number(t.qtyPerGarment) })) }
    }
  });

  await computeProduction(created.id);
  ok(res, await prisma.productionOrder.findUnique({ where: { id: created.id }, include: { product: true } }));
});

app.get('/api/productions/:id', async (req, res) => {
  const id = Number(req.params.id);
  const computed = await computeProduction(id);
  if (!computed) return res.status(404).json({ error: 'Producción no encontrada.' });
  const row = await prisma.productionOrder.findUnique({ where: { id }, include: { product: true, colorPlans: true, trimUsages: { include: { trimItem: true } } } });
  const processRates = await prisma.costProcessRate.findMany({ where: { active: true } });
  const processBreakdown = processRates.map((p) => ({ name: p.name, total: round2((row?.totalUnits || 0) * p.unitCost) }));
  ok(res, { ...row, processBreakdown });
});

app.patch('/api/productions/:id', async (req, res) => {
  const b = req.body;
  const data = {};
  if (b.title !== undefined) data.title = isNonEmpty(b.title) ? b.title.trim() : null;
  if (b.code !== undefined) {
    if (!isNonEmpty(b.code)) return bad(res, 'Código inválido.');
    data.code = b.code.trim();
  }
  if (b.status !== undefined) data.status = b.status;
  if (b.etaAt !== undefined) data.etaAt = b.etaAt ? new Date(b.etaAt) : null;

  const updated = await prisma.productionOrder.update({ where: { id: Number(req.params.id) }, data });
  await computeProduction(updated.id);
  ok(res, updated);
});

app.patch('/api/productions/:id/status', async (req, res) => ok(res, await prisma.productionOrder.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status } })));
app.delete('/api/productions/:id', async (req, res) => { await prisma.productionOrder.delete({ where: { id: Number(req.params.id) } }); ok(res, { ok: true }); });

app.get('/api/products', async (_, res) => ok(res, await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })));
app.post('/api/products', async (req, res) => {
  const b = req.body;
  if (!isNonEmpty(b.name) || !nonNegative(b.defaultConsumptionKg) || !nonNegative(b.wastePct || 0) || !nonNegative(b.rollKg || 25)) return bad(res, 'Datos de producto inválidos.');
  res.status(201).json(await prisma.product.create({ data: { name: b.name.trim(), defaultConsumptionKg: Number(b.defaultConsumptionKg), wastePct: Number(b.wastePct || 0), rollKg: Number(b.rollKg || 25), active: b.active !== false } }));
});
app.patch('/api/products/:id', async (req, res) => {
  const b = req.body;
  if (b.name !== undefined && !isNonEmpty(b.name)) return bad(res, 'Nombre inválido.');
  if (b.defaultConsumptionKg !== undefined && !nonNegative(b.defaultConsumptionKg)) return bad(res, 'Consumo inválido.');
  if (b.wastePct !== undefined && !nonNegative(b.wastePct)) return bad(res, 'Waste inválido.');
  if (b.rollKg !== undefined && !nonNegative(b.rollKg)) return bad(res, 'Rollo inválido.');
  const data = {
    ...(b.name !== undefined ? { name: b.name.trim() } : {}),
    ...(b.defaultConsumptionKg !== undefined ? { defaultConsumptionKg: Number(b.defaultConsumptionKg) } : {}),
    ...(b.wastePct !== undefined ? { wastePct: Number(b.wastePct) } : {}),
    ...(b.rollKg !== undefined ? { rollKg: Number(b.rollKg) } : {}),
    ...(b.active !== undefined ? { active: !!b.active } : {})
  };
  ok(res, await prisma.product.update({ where: { id: Number(req.params.id) }, data }));
});

app.get('/api/costs', async (_, res) => {
  const [processes, trims, fabrics] = await Promise.all([
    prisma.costProcessRate.findMany({ orderBy: { name: 'asc' } }),
    prisma.trimItem.findMany({ orderBy: { name: 'asc' } }),
    prisma.fabricPrice.findMany({ orderBy: { id: 'desc' } })
  ]);
  ok(res, { processes, trims, fabrics });
});
app.post('/api/costs/processes', async (req, res) => {
  const b = req.body;
  if (!nonNegative(b.unitCost)) return bad(res, 'Costo inválido.');
  res.status(201).json(await prisma.costProcessRate.upsert({ where: { name: b.name }, update: { unitCost: Number(b.unitCost), vendor: b.vendor || null, active: b.active !== false }, create: { name: b.name, unitCost: Number(b.unitCost), vendor: b.vendor || null, active: b.active !== false } }));
});
app.patch('/api/costs/process/:id', async (req, res) => {
  const b = req.body;
  if (b.unitCost !== undefined && !nonNegative(b.unitCost)) return bad(res, 'Costo inválido.');
  ok(res, await prisma.costProcessRate.update({ where: { id: Number(req.params.id) }, data: { ...(b.unitCost !== undefined ? { unitCost: Number(b.unitCost) } : {}), ...(b.vendor !== undefined ? { vendor: b.vendor || null } : {}), ...(b.active !== undefined ? { active: !!b.active } : {}) } }));
});
app.post('/api/costs/trims', async (req, res) => {
  const b = req.body;
  if (!isNonEmpty(b.name) || !nonNegative(b.unitCost)) return bad(res, 'Avío inválido.');
  res.status(201).json(await prisma.trimItem.create({ data: { name: b.name.trim(), unitCost: Number(b.unitCost), vendor: b.vendor || null, unitLabel: b.unitLabel || 'unit', active: b.active !== false } }));
});
app.patch('/api/costs/trim/:id', async (req, res) => {
  const b = req.body;
  if (b.name !== undefined && !isNonEmpty(b.name)) return bad(res, 'Nombre inválido.');
  if (b.unitCost !== undefined && !nonNegative(b.unitCost)) return bad(res, 'Costo inválido.');
  ok(res, await prisma.trimItem.update({ where: { id: Number(req.params.id) }, data: { ...(b.name !== undefined ? { name: b.name.trim() } : {}), ...(b.unitCost !== undefined ? { unitCost: Number(b.unitCost) } : {}), ...(b.vendor !== undefined ? { vendor: b.vendor || null } : {}), ...(b.unitLabel !== undefined ? { unitLabel: b.unitLabel || 'unit' } : {}), ...(b.active !== undefined ? { active: !!b.active } : {}) } }));
});
app.post('/api/costs/fabrics', async (req, res) => {
  const b = req.body;
  if (!isNonEmpty(b.vendor) || !isNonEmpty(b.fabricType) || !nonNegative(b.pricePerKg)) return bad(res, 'Tela inválida.');
  res.status(201).json(await prisma.fabricPrice.create({ data: { vendor: b.vendor.trim(), fabricType: b.fabricType.trim(), pricePerKg: Number(b.pricePerKg), active: b.active !== false } }));
});
app.patch('/api/costs/fabric/:id', async (req, res) => {
  const b = req.body;
  if (b.pricePerKg !== undefined && !nonNegative(b.pricePerKg)) return bad(res, 'Precio inválido.');
  ok(res, await prisma.fabricPrice.update({ where: { id: Number(req.params.id) }, data: { ...(b.vendor !== undefined ? { vendor: b.vendor } : {}), ...(b.fabricType !== undefined ? { fabricType: b.fabricType } : {}), ...(b.pricePerKg !== undefined ? { pricePerKg: Number(b.pricePerKg) } : {}), ...(b.active !== undefined ? { active: !!b.active } : {}) } }));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno. Revisá los datos e intentá de nuevo.' });
});

app.listen(PORT, () => console.log(`Production OS on http://localhost:${PORT}`));
