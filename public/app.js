async function loadHome() {
  const res = await fetch('/api/home/today');
  const data = await res.json();

  const inProgress = document.getElementById('inProgress');
  const nextPlanned = document.getElementById('nextPlanned');
  const pending = document.getElementById('pending');

  inProgress.innerHTML = data.inProgress.map((p) => `
    <div class="item">
      <b>${p.code}</b> · ${p.product}<br>
      Estado: ${p.status} · ETA: ${p.eta || '-'}<br>
      Unidades: ${p.totalUnits} · Total: $${p.totalCost} · Unit: $${p.unitCost}<br>
      ${(p.blockers || []).map((b) => `<span class="chip">${b}</span>`).join('')}
    </div>
  `).join('') || '<p class="small">No hay producciones en curso.</p>';

  nextPlanned.innerHTML = data.nextPlanned.map((p) => `
    <div class="item">
      <b>${p.code}</b> · ${p.product}<br>
      Unidades: ${p.totalUnits} · Unit: $${p.unitCost}
      <button onclick="startProduction(${p.id})">Iniciar</button>
    </div>
  `).join('') || '<p class="small">No hay planificadas.</p>';

  pending.innerHTML = data.pendingActions.map((x) => `<li>${x.text} (${x.priority})</li>`).join('');
}

window.startProduction = async (id) => {
  await fetch(`/api/production-orders/${id}/start`, { method: 'POST' });
  await loadHome();
};

function payloadFromForm(form) {
  const f = new FormData(form);
  const qty1 = Number(f.get('qty1') || 0);
  const qty2 = Number(f.get('qty2') || 0);
  const totalUnits = qty1 + qty2;
  return {
    product: f.get('product'),
    wastePct: Number(f.get('wastePct') || 0),
    consumoKgPorPrenda: Number(f.get('consumoKgPorPrenda') || 0),
    precioKg: Number(f.get('precioKg') || 0),
    lines: [
      { color: f.get('color1'), quantity: qty1 },
      { color: f.get('color2'), quantity: qty2 }
    ],
    processes: [
      { name: 'Corte', unitPrice: Number(f.get('cutting') || 0), applicableUnits: totalUnits },
      { name: 'Confección', unitPrice: Number(f.get('sewing') || 0), applicableUnits: totalUnits },
      { name: 'Estampa', unitPrice: Number(f.get('printing') || 0), applicableUnits: totalUnits },
      { name: 'Finishing', unitPrice: Number(f.get('finishing') || 0), applicableUnits: totalUnits }
    ],
    trims: [
      { name: 'Etiqueta', consumoPorPrenda: Number(f.get('labelCons') || 0), unitPrice: Number(f.get('labelPrice') || 0), applicableUnits: totalUnits }
    ],
    startNow: f.get('startNow') === 'on'
  };
}

const wizard = document.getElementById('wizard');
const summaryEl = document.getElementById('summary');

wizard.addEventListener('input', async () => {
  const payload = payloadFromForm(wizard);
  const res = await fetch('/api/production-orders/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  summaryEl.textContent = JSON.stringify(data.summary, null, 2);
});

wizard.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = payloadFromForm(wizard);
  const res = await fetch('/api/production-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  alert(`OK ${data.code} creada (${data.status})`);
  await loadHome();
});

await loadHome();
wizard.dispatchEvent(new Event('input'));
