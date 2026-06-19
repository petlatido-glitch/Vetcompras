# VetCompras SaaS

Aplicacion privada para administrar compras de una clinica veterinaria, comparar cotizaciones por proveedor y generar ordenes de compra.

## Stack

- Next.js 15 App Router
- TypeScript estricto
- Tailwind CSS + shadcn/ui
- Supabase Auth, PostgreSQL y Storage
- Prisma
- React Hook Form preparado para formularios avanzados
- Zod
- jsPDF
- Recharts

## Configuracion

1. Copia `.env.example` a `.env`.
2. Configura `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Ejecuta `npm install`.
4. Ejecuta `npm run prisma:migrate`.
5. Ejecuta el SQL de `supabase/storage.sql` en Supabase para crear buckets privados.
6. Crea un usuario administrador en Supabase Auth.
7. Inicia con `npm run dev`.

## Modulos

- Autenticacion privada con Supabase.
- Dashboard con KPIs de compras.
- CRUD de productos.
- CRUD de proveedores.
- Lista de compra.
- Cotizaciones con archivo original y captura manual de items.
- Motor de comparacion.
- Ordenes de compra con PDF y WhatsApp.
- Historial de precios con grafica.

## Arquitectura para IA OCR

La tabla `cotizaciones` conserva `archivo_url`, `archivo_tipo` y `estado_ocr`. Los items detectados viven en `cotizacion_items`, por lo que una futura integracion de OCR/IA puede leer archivos desde Supabase Storage, extraer productos y persistir resultados sin cambiar el flujo principal.
