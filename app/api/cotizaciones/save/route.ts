import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { normalizeProductName } from "@/lib/cotizacion-parser";

async function ensureCotizacionItemColumns() {
  await prisma.$executeRaw`ALTER TABLE "cotizacion_items" ADD COLUMN IF NOT EXISTS "nombre_ocr" TEXT`;
  await prisma.$executeRaw`ALTER TABLE "cotizacion_items" ADD COLUMN IF NOT EXISTS "nombre_generico" TEXT`;
  await prisma.$executeRaw`ALTER TABLE "cotizacion_items" ADD COLUMN IF NOT EXISTS "laboratorio" TEXT`;
  await prisma.$executeRaw`ALTER TABLE "cotizacion_items" ADD COLUMN IF NOT EXISTS "cantidad" INTEGER`;
  await prisma.$executeRaw`ALTER TABLE "cotizacion_items" ADD COLUMN IF NOT EXISTS "cantidad_unidad" TEXT`;
  await prisma.$executeRaw`ALTER TABLE "cotizacion_items" ADD COLUMN IF NOT EXISTS "precio_unitario" DECIMAL(12, 2)`;
  await prisma.$executeRaw`ALTER TABLE "cotizacion_items" ADD COLUMN IF NOT EXISTS "precio_total" DECIMAL(12, 2)`;
}

const cotizacionSaveSchema = z.object({
  proveedorId: z.string().uuid(),
  fecha: z.coerce.date(),
  archivoUrl: z.string().min(1),
  archivoNombre: z.string().min(1),
  archivoTipo: z.string().min(1),
  items: z
    .array(
      z.object({
        productoId: z.string().uuid().optional(),
        nombreDetectado: z.string().min(1),
        nombreOCR: z.string().optional(),
        nombreGenerico: z.string().optional(),
        laboratorio: z.string().optional(),
        cantidad: z.coerce.number().optional(),
        cantidadUnidad: z.string().optional(),
        precio: z.coerce.number().min(0),
        precioUnitario: z.coerce.number().min(0).optional(),
        precioTotal: z.coerce.number().min(0).optional(),
        presentacion: z.string().optional()
      })
    )
    .min(1)
});

export async function POST(request: Request) {
  try {
    await ensureCotizacionItemColumns();

    const body = await request.json();
    const parsed = cotizacionSaveSchema.parse(body);

    const productCache = new Map<string, { id: string; nombre: string }>();

    const cotizacion = await prisma.cotizacion.create({
      data: {
        proveedorId: parsed.proveedorId,
        fecha: parsed.fecha,
        archivoUrl: parsed.archivoUrl,
        archivoNombre: parsed.archivoNombre,
        archivoTipo: parsed.archivoTipo
      }
    });

    const operations = [] as Array<Promise<unknown>>;

    // Ensure cotizacion_items.producto_id accepts NULL so we can store items
    // without linking to Producto when no match is found. Idempotent.
    await prisma.$executeRaw`ALTER TABLE "cotizacion_items" ALTER COLUMN "producto_id" DROP NOT NULL`;

    for (const item of parsed.items) {
      let productoId = item.productoId;
        if (!productoId) {
          // Try to match an existing product by normalized name, but do NOT create new products.
          const normalizedName = normalizeProductName(item.nombreDetectado);
          if (normalizedName) {
            const existing = await prisma.producto.findFirst({
              where: {
                nombre: {
                  contains: normalizedName,
                  mode: "insensitive"
                }
              }
            });
            if (existing) {
              productoId = existing.id;
            }
          }
          // If still not found, leave productoId null — cotizaciones must not create productos in inventario.
        }

      // Ensure DB column allows NULLs for producto_id (idempotent)
      operations.push(prisma.$executeRaw`ALTER TABLE "cotizacion_items" ALTER COLUMN "producto_id" DROP NOT NULL`);

      const itemData: any = {
        cotizacionId: cotizacion.id,
        nombreDetectado: item.nombreDetectado,
        nombreOcr: item.nombreOCR || item.nombreDetectado,
        nombreGenerico: item.nombreGenerico || null,
        laboratorio: item.laboratorio || null,
        cantidad: item.cantidad ?? null,
        cantidadUnidad: item.cantidadUnidad ?? null,
        precio: item.precio,
        precioUnitario: item.precioUnitario ?? null,
        precioTotal: item.precioTotal ?? null,
        presentacion: item.presentacion || null
      };
      if (productoId) {
        itemData.productoId = productoId;
      }

      operations.push(prisma.cotizacionItem.create({ data: itemData }));
      
      // Solo crear historial de precio si hay producto asociado
      if (productoId && item.precio && Number(item.precio) > 0) {
        operations.push(
          prisma.historialPrecio.create({
            data: {
              productoId,
              proveedorId: parsed.proveedorId,
              fecha: parsed.fecha,
              precio: item.precio
            }
          })
        );
      }
    }

    await prisma.$transaction(operations);
    revalidatePath("/cotizaciones");
    revalidatePath("/dashboard");
    revalidatePath("/comparacion");
    revalidatePath("/historial-precios");

    return NextResponse.json({ success: true, cotizacionId: cotizacion.id });
  } catch (error: any) {
    const message = String(error?.message ?? error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
