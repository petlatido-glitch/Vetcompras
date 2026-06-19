import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const deleteSchema = z.object({ id: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = deleteSchema.parse(body);
    await prisma.cotizacion.delete({ where: { id: parsed.id } });
    revalidatePath("/cotizaciones");
    revalidatePath("/dashboard");
    revalidatePath("/comparacion");
    revalidatePath("/historial-precios");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = String(error?.message ?? error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
