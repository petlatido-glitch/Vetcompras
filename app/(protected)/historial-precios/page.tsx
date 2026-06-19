import { PriceChart } from "@/components/app/price-chart";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function HistorialPreciosPage() {
  const historiales = await prisma.historialPrecio.findMany({
    include: { producto: true, proveedor: true },
    orderBy: { fecha: "asc" }
  });

  const chartData = historiales.map((item) => ({
    fecha: formatDate(item.fecha),
    precio: Number(item.precio),
    proveedor: item.proveedor.nombre
  }));

  return (
    <>
      <PageHeader title="Historial de precios" description="Evolucion de precios por producto y proveedor a partir de cotizaciones registradas." />
      <Card>
        <CardHeader><CardTitle>Evolucion general</CardTitle></CardHeader>
        <CardContent>
          <PriceChart data={chartData} />
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader><CardTitle>Registros</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Proveedor</TableHead><TableHead>Fecha</TableHead><TableHead>Precio</TableHead></TableRow></TableHeader>
            <TableBody>
              {historiales.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                  <TableCell>{item.proveedor.nombre}</TableCell>
                  <TableCell>{formatDate(item.fecha)}</TableCell>
                  <TableCell>{formatCurrency(item.precio.toString())}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
