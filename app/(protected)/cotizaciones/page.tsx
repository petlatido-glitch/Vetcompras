import { PageHeader } from "@/components/app/page-header";
import { prisma } from "@/lib/prisma";
import { CotizacionesAdmin } from "@/components/cotizaciones/cotizaciones-admin";
import { serializeForClientAny } from "@/lib/serialize";

export default async function CotizacionesPage() {
  const [proveedores, productos, cotizaciones] = await Promise.all([
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
    prisma.producto.findMany({ orderBy: { nombre: "asc" } }),
    prisma.cotizacion.findMany({
      include: {
        proveedor: true,
        items: {
          select: {
            id: true,
            productoId: true,
            nombreDetectado: true,
            nombreOcr: true,
            nombreGenerico: true,
            laboratorio: true,
            cantidadUnidad: true,
            precio: true,
            presentacion: true,
            producto: true
          }
        }
      },
      orderBy: { fecha: "desc" }
    })
  ]);

  // Serialize DB results (Date, Decimal) for client consumption
  const serializableCotizaciones = serializeForClientAny(cotizaciones);
  const serializableProviders = serializeForClientAny(proveedores);
  const serializableProducts = serializeForClientAny(productos);

  return (
    <>
      <PageHeader title="Cotizaciones" description="Carga, detecta y guarda precios con cotizaciones para comparación y historial." />
      <CotizacionesAdmin providers={proveedores} products={productos} cotizaciones={serializableCotizaciones} />
    </>
  );
}
