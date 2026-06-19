import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const id = payload?.id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Falta el id del producto." }, { status: 400 });
    }

    await prisma.producto.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message ?? String(error) }, { status: 400 });
  }
}
