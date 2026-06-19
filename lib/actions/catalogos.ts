"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { listaCompraSchema, productoSchema, proveedorSchema } from "@/lib/validators/catalogos";

export async function upsertProducto(formData: FormData) {
  const parsed = productoSchema.parse({
    id: formData.get("id") || undefined,
    nombre: formData.get("nombre"),
    categoria: formData.get("categoria"),
    marca: formData.get("marca") || undefined,
    laboratorio: formData.get("laboratorio") || undefined,
    proveedorId: formData.get("proveedorId") || undefined,
    sku: formData.get("sku") || undefined,
    unidad: formData.get("unidad"),
    presentacion: formData.get("presentacion") || undefined,
    precioCompra: formData.get("precioCompra"),
    precioSugerido: formData.get("precioSugerido"),
    ultimoCosto: formData.get("ultimoCosto"),
    lote: formData.get("lote") || undefined,
    fechaVencimiento: formData.get("fechaVencimiento"),
    observaciones: formData.get("observaciones") || undefined,
    estado: formData.get("estado") || "ACTIVO"
  });
  const { id, ...data } = parsed;
  if (id) {
    await prisma.producto.update({ where: { id }, data });
  } else {
    await prisma.producto.create({ data });
  }
  revalidatePath("/productos");
  revalidatePath("/dashboard");
}

export async function deleteProducto(id: string) {
  await prisma.producto.delete({ where: { id } });
  revalidatePath("/productos");
}

export async function upsertProveedor(formData: FormData) {
  const parsed = proveedorSchema.parse({
    id: formData.get("id") || undefined,
    nombre: formData.get("nombre"),
    telefono: formData.get("telefono") || undefined,
    email: formData.get("email") || undefined,
    notas: formData.get("notas") || undefined
  });
  const { id, ...data } = parsed;
  if (id) {
    await prisma.proveedor.update({ where: { id }, data });
  } else {
    await prisma.proveedor.create({ data });
  }
  revalidatePath("/proveedores");
}

export async function deleteProveedor(id: string) {
  await prisma.proveedor.delete({ where: { id } });
  revalidatePath("/proveedores");
}

export async function upsertListaCompraItem(formData: FormData) {
  const parsed = listaCompraSchema.parse({
    id: formData.get("id") || undefined,
    productoId: formData.get("productoId") || undefined,
    nombreManual: formData.get("nombreManual") || undefined,
    cantidadRequerida: formData.get("cantidadRequerida"),
    estado: formData.get("estado") || undefined,
    notas: formData.get("notas") || undefined
  });
  const { id, nombreManual, productoId, ...data } = parsed;

  let finalProductoId = productoId as string | undefined;
  if (!finalProductoId && nombreManual) {
    const created = await prisma.producto.create({
      data: {
        nombre: nombreManual,
        categoria: "OTRO",
        unidad: "unidad",
        stockActual: 0,
        stockMinimo: 0
      }
    });
    finalProductoId = created.id;
  }

  if (id) {
    await prisma.listaCompraItem.update({ where: { id }, data: { productoId: finalProductoId, ...data } });
  } else if (finalProductoId) {
    const existing = await prisma.listaCompraItem.findUnique({ where: { productoId: finalProductoId } });
    if (existing) {
      await prisma.listaCompraItem.update({ where: { id: existing.id }, data: { productoId: finalProductoId, ...data } });
    } else {
      await prisma.listaCompraItem.create({ data: { productoId: finalProductoId, ...data } });
    }
  }
  revalidatePath("/lista-compra");
  revalidatePath("/dashboard");
}

export async function deleteListaCompraItem(id: string) {
  await prisma.listaCompraItem.delete({ where: { id } });
  revalidatePath("/lista-compra");
}
