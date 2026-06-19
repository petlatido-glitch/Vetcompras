import { NextResponse } from 'next/server';
import { findBestProductMatch } from '@/lib/comparison-match';
import { prisma } from '../../../lib/prisma';

type Body = { query?: string; productoId?: string; cantidad?: number };

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    const q = (body.query || '').trim();
    let productoId = body.productoId;
    let productoNombre: string | null = null;

    if (!productoId) {
      if (!q) return NextResponse.json({ error: 'query required' }, { status: 400 });
      const match = await findBestProductMatch(q);
      if (match) {
        productoId = match.productoId;
        productoNombre = match.productoNombre;
      }
    }

    if (!productoId) return NextResponse.json({ error: 'No matching product found' }, { status: 404 });

    const historiales = await prisma.historialPrecio.findMany({ where: { productoId }, include: { proveedor: true }, orderBy: { fecha: 'desc' } });
    const cotItems = await prisma.cotizacionItem.findMany({ where: { productoId }, include: { cotizacion: { include: { proveedor: true } } }, orderBy: { id: 'desc' } });

    const byProveedor = new Map<string, { proveedorId: string; proveedorNombre: string; precio: number; fecha: string; presentacion?: string }>();
    for (const h of historiales) {
      if (byProveedor.has(h.proveedorId)) continue;
      byProveedor.set(h.proveedorId, { proveedorId: h.proveedorId, proveedorNombre: h.proveedor.nombre, precio: Number(h.precio), fecha: h.fecha.toISOString() });
    }
    for (const ci of cotItems) {
      const provId = ci.cotizacion.proveedorId;
      const existing = byProveedor.get(provId);
      const fecha = ci.cotizacion.fecha.toISOString();
      if (!existing) {
        byProveedor.set(provId, { proveedorId: provId, proveedorNombre: ci.cotizacion.proveedor.nombre, precio: Number(ci.precio), fecha, presentacion: ci.presentacion ?? undefined });
      } else {
        if (new Date(fecha) > new Date(existing.fecha)) {
          existing.fecha = fecha;
          existing.presentacion = existing.presentacion ?? ci.presentacion ?? undefined;
        } else {
          existing.presentacion = existing.presentacion ?? ci.presentacion ?? undefined;
        }
      }
    }

    const options = Array.from(byProveedor.values()).sort((a, b) => a.precio - b.precio);
    const mejor = options[0] ?? null;
    const precioNormal = options.length > 1 ? options[options.length - 1].precio : mejor?.precio ?? 0;
    const cantidad = body.cantidad && body.cantidad > 0 ? body.cantidad : 1;

    return NextResponse.json({ productoId, productoNombre, cantidad, mejorProveedorId: mejor?.proveedorId ?? null, mejorProveedor: mejor?.proveedorNombre ?? null, mejorPrecio: mejor?.precio ?? null, precioNormal, diferencia: mejor ? (precioNormal - mejor.precio) * cantidad : 0, opciones: options.map(o => ({ proveedor: o.proveedorNombre, precio: o.precio, presentacion: o.presentacion, fechaUltimaCotizacion: o.fecha })) });
  } catch (err) {
    console.error('debug run-compare error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
