import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';

const PORT = process.env.PORT || 3000;

const state = {
  productions: [],
  nextId: 1
};

const seedPlanned = [
  { code: 'OP-1001', product: 'Remera Basic', totalUnits: 1200, status: 'PLANNED', eta: '2026-02-16', totalCost: 2820000, unitCost: 2350 },
  { code: 'OP-1002', product: 'Buzo Oversize', totalUnits: 600, status: 'PLANNED', eta: '2026-02-19', totalCost: 2310000, unitCost: 3850 },
  { code: 'OP-1003', product: 'Jogger Frisa', totalUnits: 900, status: 'PLANNED', eta: '2026-02-21', totalCost: 2970000, unitCost: 3300 }
];
state.productions.push(...seedPlanned.map((p, i) => ({ id: i + 1, checklist: defaultChecklist(), blockers: ['FALTA_TELA'], pending: [], timeline: [event('system', 'PLANNED_CREATED', p)], ...p })));
state.nextId = 10;

function defaultChecklist() {
  return {
    fabricPurchased: false,
    fabricDelivered: false,
    trimsComplete: false,
    paymentSent: false,
    inWorkshop: false
  };
}

function event(actor, type, payload = {}) {
  return { actor, type, payload, at: new Date().toISOString() };
}

function calculate(input) {
  const totalPrendas = input.lines.reduce((acc, l) => acc + Number(l.quantity || 0), 0);
  const waste = Number(input.wastePct || 0) / 100;
  const consumo = Number(input.consumoKgPorPrenda || 0);
  const precioKg = Number(input.precioKg || 0);

  const kgByColor = input.lines.map((l) => {
    const units = Number(l.quantity || 0);
    const kg = units * consumo * (1 + waste);
    return { color: l.color, units, kg: round2(kg) };
  });

  const kgTotal = round2(kgByColor.reduce((a, c) => a + c.kg, 0));
  const costoTela = round2(kgTotal * precioKg);

  const processBreakdown = (input.processes || []).map((p) => {
    const units = Number(p.applicableUnits || totalPrendas);
    const total = round2(units * Number(p.unitPrice || 0));
    return { name: p.name, units, total };
  });
  const totalProcesos = round2(processBreakdown.reduce((a, p) => a + p.total, 0));

  const trimBreakdown = (input.trims || []).map((t) => {
    const units = Number(t.applicableUnits || totalPrendas);
    const qty = round2(units * Number(t.consumoPorPrenda || 0));
    const total = round2(qty * Number(t.unitPrice || 0));
    return { name: t.name, units, quantity: qty, total };
  });
  const costoAvios = round2(trimBreakdown.reduce((a, t) => a + t.total, 0));

  const costoTotal = round2(costoTela + totalProcesos + costoAvios);
  const costoUnitario = totalPrendas > 0 ? round2(costoTotal / totalPrendas) : 0;

  return {
    totalPrendas,
    kgByColor,
    kgTotal,
    costoTela,
    processBreakdown,
    totalProcesos,
    trimBreakdown,
    costoAvios,
    costoTotal,
    costoUnitario
  };
}

function round2(v) { return Math.round(v * 100) / 100; }

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function notFound(res) { sendJson(res, 404, { error: 'Not found' }); }

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function homeData() {
  const inProgress = state.productions.filter((p) => p.status !== 'PLANNED' && p.status !== 'DONE').slice(0, 5);
  const nextPlanned = state.productions.filter((p) => p.status === 'PLANNED').slice(0, 3);
  const pendingActions = [];
  for (const p of state.productions) {
    if (!p.checklist.fabricPurchased) pendingActions.push({ productionCode: p.code, text: `Comprar tela para ${p.code}`, priority: 'HIGH' });
    if (!p.checklist.trimsComplete) pendingActions.push({ productionCode: p.code, text: `Pedir avíos para ${p.code}`, priority: 'MEDIUM' });
    if (!p.checklist.paymentSent) pendingActions.push({ productionCode: p.code, text: `Confirmar pago confección para ${p.code}`, priority: 'HIGH' });
  }
  return { inProgress, nextPlanned, pendingActions: pendingActions.slice(0, 8) };
}

function updateBlockers(p) {
  const blockers = [];
  if (!p.checklist.fabricDelivered) blockers.push('FALTA_TELA');
  if (!p.checklist.trimsComplete) blockers.push('FALTA_AVIOS');
  if (!p.checklist.paymentSent) blockers.push('FALTA_PAGO');
  p.blockers = blockers;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/home/today' && req.method === 'GET') return sendJson(res, 200, homeData());

  if (url.pathname === '/api/production-orders/draft' && req.method === 'POST') {
    const body = await parseBody(req);
    return sendJson(res, 200, { summary: calculate(body) });
  }

  if (url.pathname === '/api/production-orders' && req.method === 'POST') {
    const body = await parseBody(req);
    const summary = calculate(body);
    const id = state.nextId++;
    const code = `OP-${1000 + id}`;
    const production = {
      id,
      code,
      product: body.product || 'Sin nombre',
      status: body.startNow ? 'CUTTING' : 'PLANNED',
      eta: body.eta || null,
      totalUnits: summary.totalPrendas,
      totalKg: summary.kgTotal,
      totalCost: summary.costoTotal,
      unitCost: summary.costoUnitario,
      summary,
      checklist: defaultChecklist(),
      blockers: [],
      pending: [],
      timeline: [event('user', 'PRODUCTION_CREATED', { body }), event('system', body.startNow ? 'PRODUCTION_STARTED' : 'PRODUCTION_PLANNED')]
    };
    updateBlockers(production);
    state.productions.unshift(production);
    return sendJson(res, 201, production);
  }

  if (url.pathname.match(/^\/api\/production-orders\/\d+\/start$/) && req.method === 'POST') {
    const id = Number(url.pathname.split('/')[3]);
    const p = state.productions.find((x) => x.id === id);
    if (!p) return notFound(res);
    p.status = 'CUTTING';
    p.timeline.push(event('user', 'PRODUCTION_STARTED'));
    return sendJson(res, 200, p);
  }

  if (url.pathname.match(/^\/api\/production-orders\/\d+\/checklist$/) && req.method === 'POST') {
    const id = Number(url.pathname.split('/')[3]);
    const p = state.productions.find((x) => x.id === id);
    if (!p) return notFound(res);
    const body = await parseBody(req);
    p.checklist = { ...p.checklist, ...body };
    updateBlockers(p);
    p.timeline.push(event('user', 'CHECKLIST_UPDATED', body));
    return sendJson(res, 200, p);
  }

  if (url.pathname.startsWith('/api/')) return notFound(res);

  const filePath = url.pathname === '/' ? 'public/index.html' : join('public', url.pathname);
  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const ct = ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : 'text/html';
    res.writeHead(200, { 'Content-Type': `${ct}; charset=utf-8` });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Production OS running on http://localhost:${PORT}`);
});
