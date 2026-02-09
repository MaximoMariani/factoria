# API & Services propuestos

## Servicios de dominio

1. `ProductionPlannerService`
   - Crea borradores de OP desde plantilla de producto.
   - Aplica defaults (merma, procesos, avíos, precios).

2. `CostingService`
   - Recalcula kg por color, kg total, costos por rubro, costo total y unitario.
   - Actualiza snapshot en `ProductionOrder`.

3. `PurchaseListService`
   - Deriva faltantes de tela/avíos y genera pendientes accionables.
   - Sincroniza con estado checklist.

4. `ExecutionService`
   - Maneja cambios de estado (kanban).
   - Valida bloqueos y registra auditoría.

5. `TimelineService`
   - Escribe eventos de negocio: created, recalculated, started, moved, blocked, unblocked.

---

## Endpoints (REST)

## Home
- `GET /home/today`
  - `inProgress`: top 5 producciones en curso
  - `nextPlanned`: próximas 3
  - `pendingActions`: compras/decisiones

## Catálogos
- `GET/POST /catalog/products`
- `GET/POST /catalog/fabrics`
- `GET/POST /catalog/trims`
- `GET/POST /catalog/processes`
- `GET/POST /catalog/suppliers`
- `PUT /catalog/products/:id/templates`

## Planning Wizard
- `POST /production-orders/draft`
  - input: `productId`, `lineItems`, `wastePct?`, `fabricItemId?`
  - output: borrador con costos recalculados.

- `POST /production-orders/:id/recalculate`
  - recalcula costos en tiempo real cuando cambia cualquier input.

- `POST /production-orders/:id/plan`
  - deja estado `PLANNED`, genera purchase list + timeline.

- `POST /production-orders/:id/start`
  - transición a `CUTTING`, crea checklist por defecto.

## Ejecución
- `GET /production-orders?status=in-progress`
- `GET /production-orders/:id`
- `POST /production-orders/:id/status`
  - body: `{ "status": "SEWING" }`

- `POST /production-orders/:id/checklist/:key/toggle`

- `GET /production-orders/:id/timeline`

## Compras y bloqueos
- `GET /purchase-list?resolved=false`
- `POST /purchase-list/:id/resolve`
- `GET /production-orders/:id/blockers`

---

## Contrato de respuesta clave: resumen de costos

```json
{
  "totalUnits": 1200,
  "kgByColor": [
    { "color": "Negro", "units": 700, "kg": 161.0 },
    { "color": "Blanco", "units": 500, "kg": 115.0 }
  ],
  "kgTotal": 276.0,
  "fabricCost": 1656000,
  "processCost": 960000,
  "trimCost": 204000,
  "totalCost": 2820000,
  "unitCost": 2350,
  "breakdown": {
    "cutting": 180000,
    "sewing": 600000,
    "printing": 120000,
    "finishing": 60000
  }
}
```
