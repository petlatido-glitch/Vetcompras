import { NextResponse, type NextRequest } from "next/server";
import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orden = await prisma.ordenCompra.findUnique({
    where: { id },
    include: { proveedor: true, items: { include: { producto: true } } }
  });

  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Orden de compra veterinaria", 14, 20);
  doc.setFontSize(11);
  doc.text(`Proveedor: ${orden.proveedor.nombre}`, 14, 32);
  doc.text(`Telefono: ${orden.proveedor.telefono ?? "N/A"}`, 14, 40);
  doc.text(`Fecha: ${new Intl.DateTimeFormat("es-CO").format(orden.createdAt)}`, 14, 48);

  let y = 64;
  let total = 0;
  doc.setFontSize(10);
  doc.text("Producto", 14, y);
  doc.text("Cant.", 110, y);
  doc.text("Precio", 135, y);
  doc.text("Total", 170, y);
  y += 8;

  orden.items.forEach((item) => {
    const rowTotal = Number(item.precioUnitario) * item.cantidad;
    total += rowTotal;
    doc.text(item.producto.nombre.slice(0, 45), 14, y);
    doc.text(String(item.cantidad), 112, y);
    doc.text(formatCurrency(item.precioUnitario.toString()), 135, y);
    doc.text(formatCurrency(rowTotal), 170, y);
    y += 8;
  });

  doc.setFontSize(12);
  doc.text(`Total estimado: ${formatCurrency(total)}`, 14, y + 8);

  const bytes = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orden-${orden.id}.pdf"`
    }
  });
}
