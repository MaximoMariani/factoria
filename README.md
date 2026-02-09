# Apparel Ops App (Factoria)

MVP web app for apparel production planning and tracking.

## Monorepo structure

- `apps/web`: Next.js app (catalog, production wizard, board, history)
- `packages/db`: Prisma schema/client + SQLite seed data
- `packages/ui`: Minimal shared UI primitives

## Requirements

- Node.js 20+
- npm 10+

## Local setup

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Basic checks

```bash
npm run lint
npm run build
```

## Demo data

Seeding creates:
- Products, fabrics, trims, suppliers/workshops
- One closed production (historical)
- One in-progress production

This enables testing the full MVP flow immediately.
