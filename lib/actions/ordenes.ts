"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildComparison } from "@/lib/comparison";
import { formatCurrency } from "@/lib/utils";

export async function generarOrdenesCompra() {
  const [lista, cotizacionItems] = await Promise.all([
    prisma.listaCompraItem.findMany({ include: { producto: true } }),
    prisma.cotizacionItem.findMany({
      where: { productoId: { not: "" } },
      include: {
        producto: true,
        cotizacion: { include: { proveedor: true } }
      }
    })
  ]);

  const comparison = buildComparison(
    cotizacionItems.map((item) => ({
      productoId: item.productoId,
      productoNombre: item.producto.nombre,
      proveedorId: item.cotizacion.proveedorId,
      proveedorNombre: item.cotizacion.proveedor.nombre,
      precio: item.precio
    })),
    lista.map((item) => ({ productoId: item.productoId, cantidadRequerida: item.cantidadRequerida }))
  );

  const compra = await prisma.compra.create({
    data: {
      ahorroEstimado: comparison.ahorroEstimado,
      estado: "GENERADA"
    }
  });

  const byProveedor = new Map<string, typeof comparison.results>();
  comparison.results.forEach((item) => {
    byProveedor.set(item.mejorProveedorId, [...(byProveedor.get(item.mejorProveedorId) ?? []), item]);
  });

  for (const [proveedorId, items] of byProveedor.entries()) {
    const proveedor = await prisma.proveedor.findUniqueOrThrow({ where: { id: proveedorId } });
    const total = items.reduce((sum, item) => sum + item.mejorPrecio * item.cantidad, 0);
    const mensaje = [
      `Hola ${proveedor.nombre}, queremos realizar el siguiente pedido:`,
      ...items.map((item) => `- ${item.productoNombre}: ${item.cantidad} x ${formatCurrency(item.mejorPrecio)}`),
      `Total estimado: ${formatCurrency(total)}`
    ].join("\n");

    await prisma.ordenCompra.create({
      data: {
        compraId: compra.id,
        proveedorId,
        mensajeWhatsapp: mensaje,
        items: {
          create: items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.mejorPrecio
          }))
        }
      }
    });
  }

  revalidatePath("/ordenes-compra");
  revalidatePath("/dashboard");
}
