import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  compraId?: string;
  estado?: "BORRADOR" | "GENERADA" | "ENVIADA" | "RECIBIDA" | "CANCELADA";
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    if (!body.compraId || !body.estado) {
      return NextResponse.json({ error: "Compra y estado requeridos" }, { status: 400 });
    }

    await prisma.compra.update({
      where: { id: body.compraId },
      data: { estado: body.estado }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ordenes status error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
