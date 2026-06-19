import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, estado } = body as { id?: string; estado?: string };
  if (!id || !estado) return NextResponse.json({ success: false, error: "Missing id or estado" }, { status: 400 });

  const allowed = ["PENDIENTE", "COTIZADO", "COMPRADO", "RECIBIDO"];
  if (!allowed.includes(estado)) return NextResponse.json({ success: false, error: "Estado inválido" }, { status: 400 });

  const item = await prisma.listaCompraItem.update({ where: { id }, data: { estado: estado as any } });
  return NextResponse.json({ success: true, item });
}
