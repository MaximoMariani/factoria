# Factoria — Production OS (Node/Express + Prisma/SQLite)

Mini OS de producción con secciones separadas:
- Dashboard (overview + tareas accionables)
- Producciones (listado + detalle + edición + nueva producción)
- Productos & Consumos (catálogo persistente editable)
- Costos (procesos, avíos, telas persistentes y editables)

## Requisitos
- Node.js 18+
- npm 9+

## Setup
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
```

## Ejecutar
```bash
npm run dev
```

Abrir: http://localhost:3000

## Smoke test
```bash
npm run test:smoke
```

## Rutas principales
- `GET /` Dashboard UI
- `GET /api/dashboard`
- `GET/POST /api/tasks`
- `PATCH/DELETE /api/tasks/:id`
- `GET/POST /api/productions`
- `GET /api/productions/:id`
- `PATCH /api/productions/:id`
- `PATCH /api/productions/:id/status`
- `DELETE /api/productions/:id`
- `GET/POST /api/products`
- `PATCH /api/products/:id`
- `GET /api/costs`
- `POST /api/costs/processes`
- `PATCH /api/costs/process/:id`
- `POST /api/costs/trims`
- `PATCH /api/costs/trim/:id`
- `POST /api/costs/fabrics`
- `PATCH /api/costs/fabric/:id`

## Testing manual
- Ver `docs/TESTING.md`
