import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productoId = searchParams.get("productoId");

    if (!productoId) {
      return NextResponse.json(
        { error: "productoId requerido" },
        { status: 400 }
      );
    }

    const movimientos = await prisma.movimientoInventario.findMany({
      where: { productoId },
      orderBy: { fecha: "desc" },
      take: 100
    });

    return NextResponse.json({
      success: true,
      movimientos: movimientos.map(m => ({
        id: m.id,
        tipo: m.tipo,
        cantidad: m.cantidad,
        cantidadAntes: m.cantidadAntes,
        cantidadDespues: m.cantidadDespues,
        motivo: m.motivo,
        usuario: m.usuario,
        fecha: m.fecha
      }))
    });
  } catch (error) {
    console.error("Error fetching movimientos:", error);
    return NextResponse.json(
      { error: "Error al obtener movimientos" },
      { status: 500 }
    );
  }
}
