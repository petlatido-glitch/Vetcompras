import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

type Body = {
  query?: string;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    const query = (body.query || '').trim();

    if (!query) {
      return NextResponse.json({ error: 'query required' }, { status: 400 });
    }

    const items = await prisma.cotizacionItem.findMany({
      where: {
        AND: [
          { precio: { gt: 0 } },
          {
            OR: [
              { nombreGenerico: { contains: query, mode: 'insensitive' } },
              { nombreDetectado: { contains: query, mode: 'insensitive' } },
              { presentacion: { contains: query, mode: 'insensitive' } },
              { laboratorio: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      },
      include: {
        cotizacion: {
          include: {
            proveedor: true
          }
        }
      },
      orderBy: [{ precio: 'asc' }, { id: 'asc' }]
    });

    const formatted = items.map((item) => {
      const productoNombre = item.nombreGenerico?.trim() || item.nombreDetectado?.trim() || 'Producto desconocido';
      return {
        proveedor: item.cotizacion.proveedor.nombre,
        producto: productoNombre,
        presentacion: item.presentacion || '-',
        precio: Number(item.precio),
        fechaCotizacion: item.cotizacion.fecha.toISOString(),
        nombreGenerico: item.nombreGenerico,
        nombreDetectado: item.nombreDetectado,
        laboratorio: item.laboratorio
      };
    });

    if (formatted.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const minPrecio = formatted[0].precio;
    const itemsWithDiff = formatted.map((item) => ({
      ...item,
      isBest: item.precio === minPrecio,
      diffPercent: minPrecio > 0 ? ((item.precio / minPrecio - 1) * 100) : 0
    }));

    return NextResponse.json({
      query,
      items: itemsWithDiff,
      minPrecio
    });
  } catch (err) {
    console.error('compare error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
