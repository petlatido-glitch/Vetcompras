import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MovimientoRequest = {
  productoId: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  motivo: string;
};

const allowedTipos = ["ENTRADA", "SALIDA"] as const;

export async function POST(req: Request) {
  try {
    const body: MovimientoRequest = await req.json();
    const { productoId, tipo, cantidad, motivo } = body;

    if (!productoId || !tipo || !cantidad || !motivo) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (cantidad <= 0) {
      return NextResponse.json(
        { error: "La cantidad debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (!allowedTipos.includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de movimiento inválido" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const usuario = user?.email || user?.user_metadata?.name || "Sistema";

    const movimiento = await prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({ where: { id: productoId } });
      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      const cantidadAntes = producto.stockActual;
      let cantidadDespues = cantidadAntes;

      if (tipo === "ENTRADA") {
        cantidadDespues = cantidadAntes + cantidad;
      } else {
        if (cantidad > cantidadAntes) {
          throw new Error(`Stock insuficiente. Disponible: ${cantidadAntes}`);
        }
        cantidadDespues = cantidadAntes - cantidad;
      }

      const movimientoCreate = await tx.movimientoInventario.create({
        data: {
          productoId,
          tipo,
          cantidad,
          cantidadAntes,
          cantidadDespues,
          motivo,
          usuario
        }
      });

      await tx.producto.update({
        where: { id: productoId },
        data: { stockActual: cantidadDespues }
      });

      return movimientoCreate;
    });

    return NextResponse.json(
      {
        success: true,
        movimiento,
        nuevoStock: movimiento.cantidadDespues
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating movimiento:", error);
    const message = String(error?.message ?? "Error al registrar movimiento");
    return NextResponse.json(
      { error: message },
      { status: message.includes("Stock insuficiente") ? 400 : error?.message === "Producto no encontrado" ? 404 : 500 }
    );
  }
}
