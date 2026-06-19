import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productoSchema } from "@/lib/validators/catalogos";
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    let form: FormData | null = null;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await request.json();
      form = new FormData();
      Object.entries(json).forEach(([k, v]) => { if (v !== undefined && v !== null) form!.append(k, String(v)); });
    } else {
      form = await request.formData();
    }
    const parsed = productoSchema.parse({
      id: form.get("id") || undefined,
      nombre: form.get("nombre"),
      categoria: form.get("categoria"),
      marca: form.get("marca") || undefined,
      laboratorio: form.get("laboratorio") || undefined,
      proveedorId: form.get("proveedorId") || undefined,
      sku: form.get("sku") || undefined,
      unidad: form.get("unidad"),
      presentacion: form.get("presentacion") || undefined,
      precioCompra: form.get("precioCompra"),
      precioSugerido: form.get("precioSugerido"),
      ultimoCosto: form.get("ultimoCosto"),
      stockActual: form.get("stockActual"),
      stockMinimo: form.get("stockMinimo"),
      lote: form.get("lote") || undefined,
      fechaVencimiento: form.get("fechaVencimiento") || undefined,
      observaciones: form.get("observaciones") || undefined,
      estado: form.get("estado") || "ACTIVO"
    });

    const { id, ...data } = parsed;

    let result: any = null;
    if (id) {
      result = await prisma.producto.update({ where: { id }, data });
    } else {
      result = await prisma.producto.create({ data });
    }

    // Append a simple log entry so we can confirm create/update executed
    try {
      const logsDir = path.resolve(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
      const logPath = path.join(logsDir, 'productos.log');
      const entry = `${new Date().toISOString()}\t${id ? 'update' : 'create'}\t${result.id}\t${result.nombre}\n`;
      fs.appendFileSync(logPath, entry);
    } catch (e) {
      // ignore logging errors
      console.error('productos log error', e);
    }

    return NextResponse.json({ success: true, producto: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message ?? String(error) }, { status: 400 });
  }
}
