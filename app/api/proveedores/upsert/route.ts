import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proveedorSchema } from "@/lib/validators/catalogos";

function normalizeFormValue(value: FormDataEntryValue | null) {
  if (value === null) return undefined;
  if (value === "" || value === "undefined" || value === "null") return undefined;
  return String(value);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const raw: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      raw[key] = String(value);
    }
    console.log('[api/proveedores/upsert] raw form entries:', raw);

    const parsed = proveedorSchema.parse({
      id: normalizeFormValue(form.get("id")),
      nombre: normalizeFormValue(form.get("nombre")),
      contacto: normalizeFormValue(form.get("contacto")),
      telefono: normalizeFormValue(form.get("telefono")),
      whatsapp: normalizeFormValue(form.get("whatsapp")),
      email: normalizeFormValue(form.get("email")),
      ciudad: normalizeFormValue(form.get("ciudad")),
      direccion: normalizeFormValue(form.get("direccion")),
      categoria: normalizeFormValue(form.get("categoria")),
      estado: normalizeFormValue(form.get("estado")),
      notas: normalizeFormValue(form.get("notas"))
    });

    console.log('[api/proveedores/upsert] parsed payload:', parsed);

    const { id, ...data } = parsed;

    // sanitize optional fields: if empty or undefined -> null (but keep enums)
    const optionalFields = ["contacto", "telefono", "whatsapp", "email", "ciudad", "direccion", "notas"];
    const sanitized: Record<string, any> = {};
    Object.entries(data).forEach(([k, v]) => {
      if (optionalFields.includes(k)) {
        sanitized[k] = v === undefined || v === "" ? null : v;
      } else {
        sanitized[k] = v;
      }
    });

    const result = id
      ? await prisma.proveedor.update({ where: { id }, data: sanitized as any })
      : await prisma.proveedor.create({ data: sanitized as any });

    return NextResponse.json({ success: true, proveedor: result });
  } catch (error: any) {
    const msg = String(error?.message ?? String(error));
    let userMessage = msg;
    if (/invalid uuid/i.test(msg) || /Invalid uuid/i.test(msg)) {
      userMessage = "Identificador inválido (uuid). Revisa el campo 'id'.";
    } else if (/Unique constraint failed/i.test(msg) || /P2002/.test(msg)) {
      userMessage = "Ya existe un registro con ese valor único.";
    } else if (/Required/.test(msg) || /cannot be null/i.test(msg)) {
      userMessage = "Falta un campo obligatorio.";
    } else {
      userMessage = "Error al guardar el proveedor: " + msg;
    }
    return NextResponse.json({ success: false, error: userMessage }, { status: 400 });
  }
}
