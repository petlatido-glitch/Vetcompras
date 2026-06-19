import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const productosAll = await prisma.producto.findMany({ orderBy: { nombre: "asc" } });
  const productos = productosAll.filter((p) => p.stockActual <= p.stockMinimo);

  const added: Array<{ productoId: string; cantidad: number }> = [];

  for (const p of productos) {
    const deficit = Math.max(1, p.stockMinimo - p.stockActual);
    await prisma.listaCompraItem.upsert({
      where: { productoId: p.id },
      update: { cantidadRequerida: deficit },
      create: { productoId: p.id, cantidadRequerida: deficit }
    });
    added.push({ productoId: p.id, cantidad: deficit });
  }

  return NextResponse.json({ success: true, added, count: added.length });
}
