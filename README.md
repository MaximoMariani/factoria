# Factoria — Production OS MVP

MVP runnable (sin dependencias externas) para validar flujo operativo:
- Home “Hoy” con producciones en curso, próximas planificadas y pendientes.
- Wizard de planificación con cálculo de kg/costos en tiempo real.
- Acción de iniciar producción y actualización de bloqueos/checklist.

## Ejecutar
```bash
npm run dev
```

Abrir: `http://localhost:3000`

## Endpoints demo
- `GET /api/home/today`
- `POST /api/production-orders/draft`
- `POST /api/production-orders`
- `POST /api/production-orders/:id/start`
- `POST /api/production-orders/:id/checklist`

