import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function HistorialComprasPage() {
  const [ordenes, ordenesRecientes, proveedores, productos] = await Promise.all([
    prisma.ordenCompra.findMany({
      include: { proveedor: true, compra: true, items: { include: { producto: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.ordenCompra.findMany({
      include: { proveedor: true, compra: true, items: { include: { producto: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.proveedor.findMany({ select: { id: true, nombre: true } }),
    prisma.producto.findMany({ select: { id: true, nombre: true } })
  ]);

  const totalComprado = ordenes.reduce((sum, orden) => sum + orden.items.reduce((sub, item) => sub + Number(item.precioUnitario) * item.cantidad, 0), 0);
  const ordenesPorProveedor = proveedores.map((proveedor) => ({
    proveedor: proveedor.nombre,
    count: ordenes.filter((orden) => orden.proveedorId === proveedor.id).length
  })).sort((a, b) => b.count - a.count);
  const ordenesPorProducto = productos.map((producto) => ({
    producto: producto.nombre,
    count: ordenes.flatMap((orden) => orden.items).filter((item) => item.productoId === producto.id).reduce((sum, item) => sum + item.cantidad, 0)
  })).sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="space-y-8">
      <PageHeader title="Historial de compras" description="Consulta compras pasadas, totales por proveedor, y productos más adquiridos." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Total gastado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-semibold text-slate-900">{formatCurrency(totalComprado)}</p>
            <p className="mt-3 text-sm text-slate-500">Basado en todas las órdenes registradas.</p>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Órdenes totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-semibold text-slate-900">{ordenes.length}</p>
            <p className="mt-3 text-sm text-slate-500">Incluye órdenes en cualquier estado.</p>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Proveedores activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-semibold text-slate-900">{new Set(ordenes.map((orden) => orden.proveedorId)).size}</p>
            <p className="mt-3 text-sm text-slate-500">Proveedores que aparecen en historial de órdenes.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Órdenes recientes</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenesRecientes.map((orden) => {
                  const total = orden.items.reduce((sum, item) => sum + Number(item.precioUnitario) * item.cantidad, 0);
                  return (
                    <TableRow key={orden.id}>
                      <TableCell className="font-medium">{orden.proveedor.nombre}</TableCell>
                      <TableCell>{formatDate(orden.createdAt)}</TableCell>
                      <TableCell>{orden.compra.estado}</TableCell>
                      <TableCell>{formatCurrency(total)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compras por proveedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ordenesPorProveedor.map((item) => (
                <div key={item.proveedor} className="flex items-center justify-between rounded-3xl border border-[#E9E2E5] bg-[#FFFCF7] p-4">
                  <span>{item.proveedor}</span>
                  <Badge>{item.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos más comprados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ordenesPorProducto.map((item) => (
                <div key={item.producto} className="flex items-center justify-between rounded-3xl border border-[#E9E2E5] bg-[#FFFCF7] p-4">
                  <span>{item.producto}</span>
                  <Badge>{item.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
