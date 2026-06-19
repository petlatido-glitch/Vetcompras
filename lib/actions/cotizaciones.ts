"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cotizacionItemSchema, cotizacionSchema } from "@/lib/validators/catalogos";

export async function createCotizacion(formData: FormData) {
  const parsed = cotizacionSchema.parse({
    proveedorId: formData.get("proveedorId"),
    fecha: formData.get("fecha"),
    archivoUrl: formData.get("archivoUrl"),
    archivoNombre: formData.get("archivoNombre"),
    archivoTipo: formData.get("archivoTipo")
  });

  await prisma.cotizacion.create({ data: parsed });
  revalidatePath("/cotizaciones");
  revalidatePath("/dashboard");
}

export async function createCotizacionItem(formData: FormData) {
  const parsed = cotizacionItemSchema.parse({
    cotizacionId: formData.get("cotizacionId"),
    productoId: formData.get("productoId"),
    nombreDetectado: formData.get("nombreDetectado"),
    precio: formData.get("precio"),
    presentacion: formData.get("presentacion") || undefined
  });

  const cotizacion = await prisma.cotizacion.findUniqueOrThrow({
    where: { id: parsed.cotizacionId },
    select: { proveedorId: true, fecha: true }
  });

  const operations = [
    prisma.cotizacionItem.create({ data: parsed })
  ];

  // Solo crear historial de precio si hay producto asociado
  if (parsed.productoId) {
    operations.push(
      prisma.historialPrecio.create({
        data: {
          productoId: parsed.productoId,
          proveedorId: cotizacion.proveedorId,
          fecha: cotizacion.fecha,
          precio: parsed.precio
        }
      })
    );
  }

  await prisma.$transaction(operations);

  revalidatePath("/cotizaciones");
  revalidatePath("/comparacion");
  revalidatePath("/historial-precios");
}
