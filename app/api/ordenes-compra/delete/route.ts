import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  id?: string;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Orden requerida" }, { status: 400 });
    }

    const orden = await prisma.ordenCompra.delete({
      where: { id: body.id },
      include: { compra: { include: { ordenesCompra: { select: { id: true } } } } }
    });

    if (!orden.compra.ordenesCompra.length) {
      await prisma.compra.delete({ where: { id: orden.compra.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ordenes delete error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
