import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cotizacionUpdateSchema = z.object({
  cotizacionId: z.string().uuid(),
  items: z
    .array(
      z.object({
        id: z.string().uuid().optional(), // ID existente del item
        productoId: z.string().uuid().optional(),
        nombreDetectado: z.string().min(1),
        nombreOCR: z.string().optional(),
        nombreGenerico: z.string().optional(),
        laboratorio: z.string().optional(),
        cantidad: z.coerce.number().optional(),
        cantidadUnidad: z.string().optional(),
        precio: z.coerce.number().min(0),
        presentacion: z.string().optional()
      })
    )
    .min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = cotizacionUpdateSchema.parse(body);

    // Verificar que la cotización existe
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parsed.cotizacionId },
      include: { items: true }
    });

    if (!cotizacion) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    // Obtener IDs de items existentes
    const existingItemIds = new Set(cotizacion.items.map(item => item.id));

    // Separar items a actualizar y nuevos
    const itemsToUpdate = parsed.items.filter(item => item.id && existingItemIds.has(item.id));
    const itemsToCreate = parsed.items.filter(item => !item.id);
    const itemIdsToKeep = new Set(parsed.items.map(item => item.id).filter(Boolean));
    const itemsToDelete = cotizacion.items.filter(item => !itemIdsToKeep.has(item.id));

    // Eliminar items que no están en el nuevo payload
    for (const item of itemsToDelete) {
      await prisma.cotizacionItem.delete({
        where: { id: item.id }
      });
    }

    // Actualizar items existentes
    for (const item of itemsToUpdate) {
      await prisma.cotizacionItem.update({
        where: { id: item.id! },
        data: {
          productoId: item.productoId,
          nombreDetectado: item.nombreDetectado,
          nombreOcr: item.nombreOCR,
          nombreGenerico: item.nombreGenerico,
          laboratorio: item.laboratorio,
          cantidad: item.cantidad,
          cantidadUnidad: item.cantidadUnidad,
          precio: item.precio,
          presentacion: item.presentacion
        }
      });
    }

    // Crear nuevos items
    for (const item of itemsToCreate) {
      await prisma.cotizacionItem.create({
        data: {
          cotizacionId: parsed.cotizacionId,
          productoId: item.productoId,
          nombreDetectado: item.nombreDetectado,
          nombreOcr: item.nombreOCR,
          nombreGenerico: item.nombreGenerico,
          laboratorio: item.laboratorio,
          cantidad: item.cantidad,
          cantidadUnidad: item.cantidadUnidad,
          precio: item.precio,
          presentacion: item.presentacion
        }
      });
    }

    revalidatePath("/(protected)/cotizaciones");

    return NextResponse.json({
      success: true,
      message: "Cotización actualizada correctamente",
      cotizacionId: parsed.cotizacionId
    });
  } catch (error: any) {
    console.error("Error actualizando cotización:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validación fallida",
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "Error procesando la solicitud" },
      { status: 500 }
    );
  }
}
