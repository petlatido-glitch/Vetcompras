import { generarOrdenesCompra } from "@/lib/actions/ordenes";
import { buildComparisonFromCotizacionItems, CotizacionComparisonItem } from "@/lib/comparison";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PriceCompare from '@/components/comparison/price-compare';

export default async function ComparacionPage() {
  const cotizacionItems = await prisma.cotizacionItem.findMany({
    where: {
      precio: { gt: 0 }
    },
    include: {
      cotizacion: {
        include: {
          proveedor: true
        }
      }
    }
  });

  const comparison = buildComparisonFromCotizacionItems(
    cotizacionItems.map((item) => {
      const productoEtiqueta = (item.nombreGenerico || item.nombreDetectado || "Producto desconocido").trim();
      const presentacion = item.presentacion?.trim() || "-";
      return {
        productoEtiqueta,
        presentacion,
        proveedor: item.cotizacion.proveedor.nombre,
        precio: Number(item.precio),
        fechaCotizacion: item.cotizacion.fecha.toISOString()
      } as CotizacionComparisonItem;
    })
  );

  return (
    <>
      <PageHeader
        title="Motor de comparacion"
        description="Seleccion automatica del mejor proveedor por producto segun la lista de compra."
        action={<form action={generarOrdenesCompra}><Button className="bg-orange-500 hover:bg-orange-600">Generar ordenes</Button></form>}
      />
      <div className="mt-4"><PriceCompare /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardTitle>Costo normal</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrency(comparison.costoNormal)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Costo optimizado</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrency(comparison.costoOptimizado)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Ahorro estimado</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-orange-600">{formatCurrency(comparison.ahorroEstimado)}</p></CardContent></Card>
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Resultado por producto</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead><TableHead>Mejor proveedor</TableHead><TableHead>Mejor precio</TableHead><TableHead>Diferencia</TableHead><TableHead>Otros proveedores</TableHead></TableRow></TableHeader>
            <TableBody>
              {comparison.results.map((item) => (
                <TableRow key={item.productoId}>
                  <TableCell className="font-medium">{item.productoNombre}</TableCell>
                  <TableCell>{item.cantidad}</TableCell>
                  <TableCell>{item.mejorProveedor}</TableCell>
                  <TableCell>{formatCurrency(item.mejorPrecio)}</TableCell>
                  <TableCell className="text-orange-600">{formatCurrency(item.diferencia)}</TableCell>
                  <TableCell>{item.opciones.map((option) => `${option.proveedor}: ${formatCurrency(option.precio)}`).join(" · ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
