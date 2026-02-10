# TESTING MANUAL (v2)

## 1) Setup
1. `npm install`
2. `npx prisma generate`
3. `npx prisma migrate dev --name init`
4. `node prisma/seed.js`
5. `npm run dev`
6. Abrir `http://localhost:3000`

## 2) Crear y editar producto
1. Ir a **Productos & Consumos**.
2. Crear un producto con nombre + consumo + waste + rollo.
3. Click en **Editar** en una fila y modificar nombre/consumo/activo.
4. Verificar persistencia refrescando la página.

## 3) Crear producción
1. Ir a **Producciones** > **Nueva producción**.
2. Completar producto, unidades, consumos, colores y avío.
3. Guardar.
4. Abrir detalle y validar costos/consumos calculados.

## 4) Generación automática de tareas
1. Con producción creada, ir a **Dashboard**.
2. Revisar tareas auto (ej. comprar tela / pedir avíos / pago confección) si aplica.
3. Confirmar que no se duplican en recargas.

## 5) Toggle y edición de tareas
1. En Dashboard, sección **Pendientes accionables**:
   - cambiar filtro All/Pending/Done
   - marcar done/undone
   - editar prioridad/responsable
   - borrar tarea
2. Verificar que los cambios persisten al refrescar.

## 6) Editar costos
1. Ir a **Costos**.
2. Crear y editar:
   - proceso (costo/proveedor/activo)
   - avío (nombre/costo/unidad/proveedor/activo)
   - tela (proveedor/tipo/precio/activo)
3. Volver a una producción y validar recalculo de costos.

## 7) Smoke checks
- `npm run test:smoke`
