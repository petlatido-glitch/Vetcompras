import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(async () => {
    // try form data
    const form = await req.formData();
    return { id: form.get("id") } as any;
  });
  const { id } = body as { id?: string };
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  await prisma.listaCompraItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
