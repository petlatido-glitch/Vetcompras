import { NextResponse } from "next/server";

type ItemIn = {
  proveedor: string;
  producto: string;
  presentacion?: string | null;
  precio: number;
  fechaCotizacion?: string | null;
  cantidad: number;
  observacion?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: ItemIn[] = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    // group by proveedor
    const groups: Record<string, { proveedor: string; items: any[]; subtotal: number }> = {};

    for (const it of items) {
      const proveedorKey = it.proveedor || "Proveedor desconocido";
      const unitPrice = Number(it.precio) || 0;
      const cantidad = Number(it.cantidad) || 0;
      const subtotal = unitPrice * cantidad;

      if (!groups[proveedorKey]) {
        groups[proveedorKey] = { proveedor: proveedorKey, items: [], subtotal: 0 };
      }

      groups[proveedorKey].items.push({
        producto: it.producto,
        presentacion: it.presentacion ?? "-",
        cantidad,
        precioUnitario: unitPrice,
        subtotal,
        observacion: it.observacion ?? null,
        fechaCotizacion: it.fechaCotizacion ?? null
      });

      groups[proveedorKey].subtotal += subtotal;
    }

    const orders = Object.values(groups).map((g) => ({
      proveedor: g.proveedor,
      items: g.items,
      subtotal: g.subtotal,
      total: g.subtotal // placeholder for taxes/fees
    }));

    const totalGeneral = orders.reduce((s, o) => s + o.total, 0);

    return NextResponse.json({ orders, totalGeneral });
  } catch (err) {
    console.error("generate-from-selection error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
