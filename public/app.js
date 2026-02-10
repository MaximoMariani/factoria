const views = ['dashboard', 'productions', 'products', 'costs'];
const title = document.getElementById('title');
const actions = document.getElementById('actions');

const state = { productionRows: [] };

function showError(msg) { alert(msg || 'Ocurrió un error'); }
async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error de servidor');
  return data;
}

function showView(view) {
  views.forEach((v) => document.getElementById(v).classList.toggle('hidden', v !== view));
  title.textContent = ({ dashboard: 'Dashboard', productions: 'Producciones', products: 'Productos & Consumos', costs: 'Costos' })[view];
  actions.innerHTML = view === 'productions' ? '<button class="primary" id="newProd">Nueva producción</button>' : '';
  if (view === 'productions') document.getElementById('newProd').onclick = () => renderNewProduction();
}
document.querySelectorAll('.sidebar button').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));

function priorityBadge(p) { return `<span class="badge badge-${p.toLowerCase()}">${p}</span>`; }

async function renderDashboard() {
  const d = await fetchJSON('/api/dashboard');
  document.getElementById('dashboard').innerHTML = `
    <div class='card'><h3>Producciones en curso</h3>${d.inProgress.map((p) => `<p><b>${p.code}</b> · ${p.title || p.product.name} · ${p.status} · $${p.unitCost}/u</p>`).join('') || '<p class="small">Sin registros</p>'}</div>
    <div class='card'><h3>Próximas planificadas</h3>${d.nextPlanned.map((p) => `<p><b>${p.code}</b> · ${p.title || p.product.name} · ${p.totalUnits} u</p>`).join('') || '<p class="small">Sin registros</p>'}</div>
    <div class='card full'>
      <div class='row'><h3>Pendientes accionables</h3><select id='taskFilter'><option value='ALL'>All</option><option value='PENDING'>Pending</option><option value='DONE'>Done</option></select><button id='newTaskBtn'>+ Tarea</button></div>
      <div id='taskList'></div>
    </div>`;

  document.getElementById('taskFilter').onchange = (e) => renderTasks(e.target.value);
  document.getElementById('newTaskBtn').onclick = async () => {
    const t = prompt('Título de tarea');
    if (!t) return;
    await fetchJSON('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, priority: 'MEDIUM' }) });
    await renderTasks('PENDING');
  };
  await renderTasks('ALL');
}

async function renderTasks(filter = 'ALL') {
  const tasks = await fetchJSON(`/api/tasks?filter=${filter}`);
  document.getElementById('taskList').innerHTML = tasks.map((t) => `
    <div class='task-row'>
      <input type='checkbox' ${t.done ? 'checked' : ''} onchange='toggleTask(${t.id}, this.checked)' />
      <div class='task-main'>
        <div><b>${t.title}</b> ${priorityBadge(t.priority)}</div>
        <div class='small'>${t.assignee || 'Sin responsable'} ${t.dueDate ? `· vence ${t.dueDate.slice(0, 10)}` : ''}</div>
        ${t.productionOrder ? `<a href='#' onclick='goToProduction(${t.productionOrder.id});return false;'>Ligada a ${t.productionOrder.code}</a>` : ''}
      </div>
      <button onclick='editTask(${t.id}, ${JSON.stringify(t.title).replace(/"/g, '&quot;')}, "${t.priority}", ${JSON.stringify(t.assignee || '').replace(/"/g, '&quot;')})'>Editar</button>
      <button onclick='deleteTask(${t.id})'>Borrar</button>
    </div>`).join('') || '<p class="small">Sin tareas</p>';
}

window.toggleTask = async (id, done) => { await fetchJSON(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done }) }); await renderTasks(document.getElementById('taskFilter').value); };
window.deleteTask = async (id) => { await fetchJSON(`/api/tasks/${id}`, { method: 'DELETE' }); await renderTasks(document.getElementById('taskFilter').value); };
window.editTask = async (id, titleV, priorityV, assigneeV) => {
  const title = prompt('Título', titleV);
  if (!title) return;
  const priority = prompt('Prioridad HIGH/MEDIUM/LOW', priorityV) || priorityV;
  const assignee = prompt('Responsable (opcional)', assigneeV || '') || '';
  await fetchJSON(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, priority, assignee }) });
  await renderTasks(document.getElementById('taskFilter').value);
};
window.goToProduction = async (id) => { showView('productions'); await openDetail(id); };

async function renderProductions() {
  const rows = await fetchJSON('/api/productions');
  state.productionRows = rows;
  document.getElementById('productions').innerHTML = `
    <div class='card full'>
      <div class='row'><select id='statusFilter'><option>ALL</option><option>DRAFT</option><option>PLANNED</option><option>RUNNING</option><option>DONE</option></select></div>
      <table class='table'><thead><tr><th>Código</th><th>Título</th><th>Producto</th><th>Status</th><th>Unidades</th><th>Costo Unit.</th><th></th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${r.code}</td><td>${r.title || '-'}</td><td>${r.product.name}</td><td>${r.status}</td><td>${r.totalUnits}</td><td>$${r.unitCost}</td><td><button onclick='openDetail(${r.id})'>Detalle</button></td></tr>`).join('')}</tbody></table>
    </div>
    <div id='prodDetail' class='card full'><p class='small'>Seleccioná una producción.</p></div>`;

  document.getElementById('statusFilter').onchange = async (e) => {
    const filtered = await fetchJSON(`/api/productions?status=${e.target.value}`);
    document.querySelector('#productions tbody').innerHTML = filtered.map((r) => `<tr><td>${r.code}</td><td>${r.title || '-'}</td><td>${r.product.name}</td><td>${r.status}</td><td>${r.totalUnits}</td><td>$${r.unitCost}</td><td><button onclick='openDetail(${r.id})'>Detalle</button></td></tr>`).join('');
  };
}

window.openDetail = async (id) => {
  const p = await fetchJSON(`/api/productions/${id}`);
  document.getElementById('prodDetail').innerHTML = `
    <h3>${p.code} · ${p.title || p.product.name}</h3>
    <p>Status: <b>${p.status}</b> · ETA: ${p.etaAt ? p.etaAt.slice(0, 10) : '-'}</p>
    <p>Unidades: ${p.totalUnits} · Kg: ${p.kgNeeded} · Rollos: ${p.rollsNeeded}</p>
    <p>Costo total: $${p.totalCost} · Unitario: $${p.unitCost}</p>
    <h4>Consumo por color</h4>
    ${p.colorPlans.map((c) => `<p>${c.colorName}: ${c.units}u · ${c.kgRequired}kg</p>`).join('') || '<p class="small">Sin split</p>'}
    <h4>Costos desglosados</h4>
    <p>Tela: $${p.fabricCost} · Procesos: $${p.processCost} · Avíos: $${p.trimCost}</p>
    ${p.processBreakdown.map((x) => `<p>${x.name}: $${x.total}</p>`).join('')}
    <div class='actions'>
      <button onclick='setStatus(${p.id},"RUNNING")'>Iniciar</button>
      <button onclick='setStatus(${p.id},"DONE")'>Finalizar</button>
      <button onclick='editProduction(${p.id}, ${JSON.stringify(p.title || '').replace(/"/g, '&quot;')}, ${JSON.stringify(p.code).replace(/"/g, '&quot;')})'>Editar</button>
      <button onclick='removeProduction(${p.id})'>Eliminar</button>
    </div>`;
};

window.editProduction = async (id, oldTitle, oldCode) => {
  const title = prompt('Título visible', oldTitle || '');
  const code = prompt('Código OP', oldCode || '');
  await fetchJSON(`/api/productions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, code }) });
  await renderProductions();
};
window.setStatus = async (id, status) => { await fetchJSON(`/api/productions/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); await renderProductions(); await renderDashboard(); };
window.removeProduction = async (id) => { await fetchJSON(`/api/productions/${id}`, { method: 'DELETE' }); await renderProductions(); await renderDashboard(); };

async function renderNewProduction() {
  const [products, costs] = await Promise.all([fetchJSON('/api/products'), fetchJSON('/api/costs')]);
  document.getElementById('prodDetail').innerHTML = `
    <h3>Nueva producción</h3>
    <div class='row'>
      <select id='npProduct'>${products.map((p) => `<option value='${p.id}' data-cons='${p.defaultConsumptionKg}' data-waste='${p.wastePct}' data-roll='${p.rollKg}'>${p.name}</option>`)}</select>
      <input id='npTitle' placeholder='Título (opcional)'>
      <input id='npPlannedUnits' type='number' placeholder='Unidades'>
      <input id='npEta' type='date'>
    </div>
    <div class='row'><input id='npCons' type='number' step='0.001'><input id='npWaste' type='number' step='0.1'><input id='npRoll' type='number' step='0.1'><select id='npStatus'><option>PLANNED</option><option>DRAFT</option></select></div>
    <div class='row'><input id='npColor1' placeholder='Color 1'><input id='npUnits1' type='number' placeholder='Units 1'><input id='npColor2' placeholder='Color 2'><input id='npUnits2' type='number' placeholder='Units 2'></div>
    <div class='row'><select id='npTrim'>${costs.trims.map((t) => `<option value='${t.id}'>${t.name}</option>`)}</select><input id='npTrimQty' type='number' step='0.1' value='1'><button class='primary' id='npSave'>Guardar producción</button></div>`;

  const applyDefaults = () => {
    const selected = document.getElementById('npProduct').selectedOptions[0];
    npCons.value = selected.dataset.cons;
    npWaste.value = selected.dataset.waste;
    npRoll.value = selected.dataset.roll;
  };
  applyDefaults();
  npProduct.onchange = applyDefaults;

  npSave.onclick = async () => {
    try {
      const colorPlans = [];
      if (npColor1.value && Number(npUnits1.value) > 0) colorPlans.push({ colorName: npColor1.value, units: Number(npUnits1.value) });
      if (npColor2.value && Number(npUnits2.value) > 0) colorPlans.push({ colorName: npColor2.value, units: Number(npUnits2.value) });
      await fetchJSON('/api/productions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          productId: Number(npProduct.value), title: npTitle.value, plannedUnits: Number(npPlannedUnits.value || 0), consumptionKgPerUnit: Number(npCons.value), wastePct: Number(npWaste.value), rollKg: Number(npRoll.value), etaAt: npEta.value, status: npStatus.value, colorPlans, trimUsages: [{ trimItemId: Number(npTrim.value), qtyPerGarment: Number(npTrimQty.value) }]
        })
      });
      await renderProductions();
      await renderDashboard();
    } catch (e) { showError(e.message); }
  };
}

async function renderProducts() {
  const rows = await fetchJSON('/api/products');
  document.getElementById('products').innerHTML = `
    <div class='card full'>
      <h3>Catálogo de productos</h3>
      <div class='row'><input id='pName' placeholder='Nombre'><input id='pCons' type='number' step='0.001' placeholder='Kg/prenda'><input id='pWaste' type='number' step='0.1' placeholder='Waste %'><input id='pRoll' type='number' step='0.1' placeholder='Kg/rollo'></div>
      <button class='primary' id='pSave'>Guardar producto</button>
      <table class='table'><thead><tr><th>Nombre</th><th>Kg/U</th><th>Waste%</th><th>Rollo Kg</th><th>Activo</th><th>Acción</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${r.name}</td><td>${r.defaultConsumptionKg}</td><td>${r.wastePct}</td><td>${r.rollKg}</td><td>${r.active}</td><td><button onclick='editProduct(${r.id}, ${JSON.stringify(r.name).replace(/"/g, '&quot;')}, ${r.defaultConsumptionKg}, ${r.wastePct}, ${r.rollKg}, ${r.active})'>Editar</button></td></tr>`).join('')}</tbody></table>
    </div>`;

  pSave.onclick = async () => {
    try { await fetchJSON('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: pName.value, defaultConsumptionKg: Number(pCons.value), wastePct: Number(pWaste.value), rollKg: Number(pRoll.value), active: true }) }); await renderProducts(); }
    catch (e) { showError(e.message); }
  };
}

window.editProduct = async (id, oldName, oldCons, oldWaste, oldRoll, oldActive) => {
  const name = prompt('Nombre', oldName);
  if (!name) return;
  const defaultConsumptionKg = Number(prompt('Consumo kg/u', oldCons));
  const wastePct = Number(prompt('Waste %', oldWaste));
  const rollKg = Number(prompt('Kg por rollo', oldRoll));
  const active = confirm('¿Producto activo? OK=Sí / Cancel=No');
  try {
    await fetchJSON(`/api/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, defaultConsumptionKg, wastePct, rollKg, active: oldActive ? active : active }) });
    await renderProducts();
  } catch (e) { showError(e.message); }
};

async function renderCosts() {
  const c = await fetchJSON('/api/costs');
  document.getElementById('costs').innerHTML = `
    <div class='card'>
      <h3>Procesos</h3>
      <div class='row'><select id='cpName'><option>CUT</option><option>SEW</option><option>PRINT</option><option>FINISH</option></select><input id='cpUnitCost' type='number' placeholder='Costo unitario'><input id='cpVendor' placeholder='Proveedor'><button class='primary' id='cpSave'>Guardar</button></div>
      ${c.processes.map((p) => `<p>${p.name}: $${p.unitCost} <span class='small'>${p.vendor || ''}</span> <button onclick='editProcess(${p.id}, ${p.unitCost}, ${JSON.stringify(p.vendor || '').replace(/"/g, '&quot;')}, ${p.active})'>Editar</button></p>`).join('')}
    </div>
    <div class='card'>
      <h3>Telas</h3>
      <div class='row'><input id='fVendor' placeholder='Proveedor'><input id='fType' placeholder='Tipo tela'><input id='fPrice' type='number' placeholder='$ por kg'><button class='primary' id='fSave'>Guardar</button></div>
      ${c.fabrics.map((f) => `<p>${f.fabricType} - ${f.vendor}: $${f.pricePerKg}/kg <button onclick='editFabric(${f.id}, ${JSON.stringify(f.vendor).replace(/"/g, '&quot;')}, ${JSON.stringify(f.fabricType).replace(/"/g, '&quot;')}, ${f.pricePerKg}, ${f.active})'>Editar</button></p>`).join('')}
    </div>
    <div class='card full'>
      <h3>Avíos</h3>
      <div class='row'><input id='tName' placeholder='Nombre'><input id='tUnitCost' type='number' placeholder='Costo unitario'><input id='tVendor' placeholder='Proveedor'><input id='tUnit' placeholder='Unidad'></div>
      <button class='primary' id='tSave'>Guardar avío</button>
      ${c.trims.map((t) => `<p>${t.name}: $${t.unitCost}/${t.unitLabel} <span class='small'>${t.vendor || ''}</span> <button onclick='editTrim(${t.id}, ${JSON.stringify(t.name).replace(/"/g, '&quot;')}, ${t.unitCost}, ${JSON.stringify(t.vendor || '').replace(/"/g, '&quot;')}, ${JSON.stringify(t.unitLabel).replace(/"/g, '&quot;')}, ${t.active})'>Editar</button></p>`).join('')}
    </div>`;

  cpSave.onclick = async () => { try { await fetchJSON('/api/costs/processes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: cpName.value, unitCost: Number(cpUnitCost.value), vendor: cpVendor.value, active: true }) }); await renderCosts(); } catch (e) { showError(e.message); } };
  fSave.onclick = async () => { try { await fetchJSON('/api/costs/fabrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor: fVendor.value, fabricType: fType.value, pricePerKg: Number(fPrice.value), active: true }) }); await renderCosts(); } catch (e) { showError(e.message); } };
  tSave.onclick = async () => { try { await fetchJSON('/api/costs/trims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: tName.value, unitCost: Number(tUnitCost.value), vendor: tVendor.value, unitLabel: tUnit.value || 'unit', active: true }) }); await renderCosts(); } catch (e) { showError(e.message); } };
}

window.editProcess = async (id, unitCostV, vendorV, activeV) => {
  const unitCost = Number(prompt('Costo unitario', unitCostV));
  const vendor = prompt('Proveedor', vendorV || '') || '';
  const active = confirm('¿Activo? OK=Sí / Cancel=No');
  await fetchJSON(`/api/costs/process/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unitCost, vendor, active: activeV ? active : active }) });
  await renderCosts();
};
window.editTrim = async (id, nameV, unitCostV, vendorV, unitLabelV, activeV) => {
  const name = prompt('Nombre', nameV);
  if (!name) return;
  const unitCost = Number(prompt('Costo unitario', unitCostV));
  const vendor = prompt('Proveedor', vendorV || '') || '';
  const unitLabel = prompt('Unidad', unitLabelV || 'unit') || 'unit';
  const active = confirm('¿Activo? OK=Sí / Cancel=No');
  await fetchJSON(`/api/costs/trim/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, unitCost, vendor, unitLabel, active: activeV ? active : active }) });
  await renderCosts();
};
window.editFabric = async (id, vendorV, fabricTypeV, pricePerKgV, activeV) => {
  const vendor = prompt('Proveedor', vendorV);
  const fabricType = prompt('Tipo tela', fabricTypeV);
  const pricePerKg = Number(prompt('Precio/kg', pricePerKgV));
  const active = confirm('¿Activo? OK=Sí / Cancel=No');
  await fetchJSON(`/api/costs/fabric/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor, fabricType, pricePerKg, active: activeV ? active : active }) });
  await renderCosts();
};

(async function init() {
  try {
    await renderDashboard();
    await renderProductions();
    await renderProducts();
    await renderCosts();
    showView('dashboard');
  } catch (e) {
    showError(e.message);
  }
})();
