# Factoria MVP (Node.js + TypeScript + Prisma + Express)

MVP runnable basado en los documentos y el esquema Prisma existente.

## Requisitos

- Node.js 20+
- npm

## Instalación

```bash
npm install
```

## Prisma (SQLite local)

La app está configurada para SQLite con:

- `DATABASE_URL="file:./dev.db"` en `.env`
- `provider = "sqlite"` en `prisma/schema.prisma`

Generar cliente:

```bash
npx prisma generate
```

Correr migración inicial:

```bash
npx prisma migrate dev --name init
```

## Ejecutar servidor

Modo desarrollo:

```bash
npm run dev
```

Build producción:

```bash
npm run build
npm run start
```

## URL base

- App web mínima: `http://localhost:3000`
- Health: `GET http://localhost:3000/api/health`

## Endpoints REST incluidos

- `GET /api/home/today` → devuelve estructura demo de producciones.
- `POST /api/production-orders/draft` → acepta datos y devuelve draft mock con resumen de costos.
- `POST /api/production-orders` → simula creación de orden y devuelve OK.
- `POST /api/production-orders/:id/start` → simula inicio de orden.
- `POST /api/production-orders/:id/checklist` → simula actualización de checklist.

### Ejemplo body para draft

```json
{
  "productId": "prod-001",
  "wastePct": 7,
  "fabricItemId": "fabric-001",
  "lineItems": [
    { "color": "Negro", "size": "M", "quantity": 500, "consumptionKg": 0.23 },
    { "color": "Blanco", "size": "L", "quantity": 300, "consumptionKg": 0.24 }
  ]
}
```

## Flujo pedido en el enunciado

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
