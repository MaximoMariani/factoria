# Production OS para indumentaria — Diseño funcional

## 1) North Star UX

### Home = “Hoy” (operativo)
Objetivo: que en 10 segundos el CEO/fabricante sepa qué está pasando y qué decidir.

Bloques de la pantalla:

1. **Producciones en curso (Top 5)**
   - Nombre/código de OP, producto, unidades.
   - Estado actual (`CUTTING`, `SEWING`, `PRINTING`, `FINISHING`).
   - ETA calculado por fecha planificada + avance.
   - Bloqueos activos (chips): `FALTA_TELA`, `FALTA_AVIOS`, `FALTA_PAGO`, `SIN_TALLER`.
   - Costo total estimado y costo unitario actual.
   - CTA: “Abrir” / “Mover estado”.

2. **Próximas 3 planificadas**
   - Fecha sugerida de inicio.
   - Unidades + costo proyectado.
   - CTA principal: **Iniciar** (1 click).

3. **Pendientes accionables (compras + decisiones)**
   - “Comprar 38kg tela Negro — Proveedor X — $...”.
   - “Pedir 600 etiquetas — Proveedor Y — $...”.
   - “Confirmar precio confección — Taller Z”.
   - Cada pendiente tiene responsable, prioridad y fecha sugerida.

---

## 2) Módulos

## 2.1 Ejecución (Producciones actuales)
- **Vista Kanban** por estados + **lista detallada**.
- Cada tarjeta de producción expone checklist operativo:
  - Tela comprada / entregada.
  - Avíos completos.
  - Pago enviado.
  - En taller.
- Cambios de estado con 1 click.
- Timeline auditable: quién hizo qué y cuándo.

## 2.2 Planning Wizard (Próximas producciones)
Wizard de 6 pasos (ultra corto):
1. Elegir producto/modelo.
2. Colores + cantidades.
3. Confirmar tela + merma%.
4. Confirmar procesos (precargados por plantilla).
5. Confirmar avíos (precargados por plantilla).
6. Resumen final + `Planificar` / `Iniciar`.

Resultados automáticos:
- Lista de compras exacta (tela/avíos).
- Presupuesto total y unitario con breakdown por rubro.

## 2.3 Catálogos
- Productos + modelos/talles opcionales.
- Telas.
- Avíos.
- Procesos.
- Proveedores.
- Plantillas por producto para crear OP en 30-60 segundos.

---

## 3) Reglas de cálculo

Inputs:
- cantidades por color/modelo/talle
- consumoKgPorPrenda
- wastePct
- precioKg tela
- precio unitario por proceso
- avíos (consumo por prenda + precio unitario)

Fórmulas:
- `totalPrendas = SUM(cantidades)`
- `kgColor = prendasColor * consumoKgPorPrenda * (1 + wastePct)`
- `kgTotal = SUM(kgColor)`
- `costoTela = kgTotal * precioKg`
- `costoProcesoX = prendasAplicables * precioUnitarioProceso`
- `totalProcesos = SUM(costoProcesoX)`
- `costoAvio = SUM(prendasAplicables * consumoPorPrenda * precioUnitario)`
- `costoTotal = costoTela + totalProcesos + costoAvio`
- `costoUnitario = costoTotal / totalPrendas`

La UI debe recalcular en tiempo real ante cualquier edición.

---

## 4) Flujo recomendado “máximo automático, mínimo input”

1. Usuario entra a Home y ve bloqueos + pendientes.
2. Hace click en “Nueva producción”
3. Selecciona producto con plantilla (autocompleta procesos y avíos).
4. Carga cantidades por color (tabla rápida).
5. Ajusta merma/precios sólo si cambió algo.
6. Ve resumen instantáneo (kg, compras, costos total/unitario).
7. Planifica o inicia.
8. Al iniciar:
   - crea checklist inicial,
   - crea timeline event,
   - publica pendientes de compra en Home.

---

## 5) Mapeo a Acceptance Criteria

1. 2 colores → cálculo por color/total: cubierto en `ProductionOrderLineItem` + endpoint de cálculo.
2. Procesos → costo por proceso: cubierto en `ProductionOrderProcess`.
3. Avíos → cantidad/costo total: cubierto en `ProductionOrderTrim`.
4. Costo total/unitario en tiempo real: endpoint `recalculate` + campos snapshot.
5. Iniciar producción: transición `PLANNED -> CUTTING` + checklist por defecto.
6. Home con pendientes y bloqueos: query agregada sobre `PurchaseListItem` y checklist incompleto.
