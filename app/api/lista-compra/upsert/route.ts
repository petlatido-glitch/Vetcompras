import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listaCompraSchema } from "@/lib/validators/catalogos";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = listaCompraSchema.parse({
    id: body.id || undefined,
    productoId: body.productoId || undefined,
    nombreManual: body.nombreManual || undefined,
    cantidadRequerida: body.cantidadRequerida,
    estado: body.estado || undefined,
    notas: body.notas || undefined
  });

  let finalProductoId = parsed.productoId;
  if (!finalProductoId && parsed.nombreManual) {
    const created = await prisma.producto.create({
      data: {
        nombre: parsed.nombreManual,
        categoria: "OTRO",
        unidad: "unidad",
        stockActual: 0,
        stockMinimo: 0
      }
    });
    finalProductoId = created.id;
  }

  let item;
  if (parsed.id) {
    item = await prisma.listaCompraItem.update({ where: { id: parsed.id }, data: { productoId: finalProductoId, cantidadRequerida: parsed.cantidadRequerida, estado: parsed.estado, notas: parsed.notas } });
  } else if (finalProductoId) {
    const existing = await prisma.listaCompraItem.findUnique({ where: { productoId: finalProductoId } });
    if (existing) {
      item = await prisma.listaCompraItem.update({ where: { id: existing.id }, data: { productoId: finalProductoId, cantidadRequerida: parsed.cantidadRequerida, estado: parsed.estado, notas: parsed.notas } });
    } else {
      item = await prisma.listaCompraItem.create({ data: { productoId: finalProductoId, cantidadRequerida: parsed.cantidadRequerida, estado: parsed.estado, notas: parsed.notas } });
    }
  } else {
    return NextResponse.json({ success: false, error: "Producto inválido" }, { status: 400 });
  }

  return NextResponse.json({ success: true, item });
}
