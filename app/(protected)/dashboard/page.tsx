import { BarChart3, ClipboardList, Package, TrendingDown } from "lucide-react";
import { subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { serializeForClientAny } from "@/lib/serialize";
import { buildComparison } from "@/lib/comparison";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const [pendientes, recientes, productos, lista, cotizacionItems] = await Promise.all([
    prisma.listaCompraItem.count(),
    prisma.cotizacion.count({ where: { createdAt: { gte: subDays(new Date(), 30) } } }),
    prisma.producto.findMany({ select: { stockActual: true, stockMinimo: true } }),
    prisma.listaCompraItem.findMany({ include: { producto: true }, take: 6 }),
    prisma.cotizacionItem.findMany({
      where: { productoId: { not: "" } },
      include: { producto: true, cotizacion: { include: { proveedor: true } } }
    })
  ]);
  const stockBajo = productos.filter((producto) => producto.stockActual <= producto.stockMinimo).length;

  const comparison = buildComparison(
    cotizacionItems.map((item) => ({
      productoId: item.productoId ?? "",
      productoNombre: item.producto?.nombre ?? "",
      proveedorId: item.cotizacion.proveedorId,
      proveedorNombre: item.cotizacion.proveedor?.nombre ?? "",
      precio: item.precio
    })),
    lista.map((item) => ({ productoId: item.productoId ?? "", cantidadRequerida: item.cantidadRequerida }))
  );

  const stats = [
    { title: "Pendientes de compra", value: pendientes, icon: ClipboardList },
    { title: "Cotizaciones recientes", value: recientes, icon: BarChart3 },
    { title: "Ahorro estimado mes", value: formatCurrency(comparison.ahorroEstimado), icon: TrendingDown },
    { title: "Productos stock bajo", value: stockBajo, icon: Package }
  ];

  return (
    <div className="space-y-14">
      <section className="rounded-[2.5rem] border border-[#E9D8C6] bg-[#FFFCF8] p-8 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex h-1.5 w-20 rounded-full bg-gradient-to-r from-[#FFB26B] via-[#FEE8D6] to-[#8EC5E8]" />
            <div className="space-y-3">
              <h1 className="text-5xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">Vista rápida de compras, cotizaciones y ahorro potencial.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden hover:shadow-[0_22px_75px_rgba(15,23,42,0.08)]">
              <CardHeader className="flex items-start justify-between gap-5 p-7">
                <div className="space-y-3">
                  <CardTitle className="text-[0.78rem] uppercase tracking-[0.16em] text-slate-500">{stat.title}</CardTitle>
                  <p className="text-4xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#FFEDD9] text-[#D86F36] shadow-[0_10px_30px_rgba(215,109,57,0.12)]">
                  <Icon className="h-6 w-6" />
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="px-7 pt-7">
            <CardTitle className="text-xl font-semibold">Lista de compra prioritaria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-7 pb-7 pt-0">
            {serializeForClientAny(lista).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-[#E9DDD4] bg-[#FFFCF8] p-5">
                <div>
                  <p className="font-semibold text-slate-900">{item.producto.nombre}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.producto.categoria}</p>
                </div>
                <Badge className="bg-[#FFF1E7] text-[#B7632C]">{item.cantidadRequerida} {item.producto.unidad}</Badge>
              </div>
            ))}
            {lista.length === 0 && <p className="text-sm text-slate-500">No hay productos pendientes.</p>}
            {lista.length === 0 && <p className="text-sm text-slate-500">No hay productos pendientes.</p>}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="px-7 pt-7">
            <CardTitle className="text-xl font-semibold">Mejores oportunidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-7 pb-7 pt-0">
            {comparison.results.slice(0, 5).map((item) => (
              <div key={item.productoId} className="rounded-[1.75rem] border border-[#E9DDD4] bg-[#FFFCF8] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{item.productoNombre}</p>
                  <Badge className="bg-[#FFF4E6] text-[#D86F36]">{formatCurrency(item.diferencia)}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">{item.mejorProveedor} · {formatCurrency(item.mejorPrecio)}</p>
              </div>
            ))}
            {comparison.results.length === 0 && <p className="text-sm text-slate-500">Agrega cotizaciones con items para calcular ahorros.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
