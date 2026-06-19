import { PageHeader } from "@/components/app/page-header";
import { ListaCompraForm } from "@/components/forms/lista-compra-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { ListaAdmin } from "@/components/lista-compra/lista-admin";

export default async function ListaCompraPage() {
  const [productos, lista] = await Promise.all([
    prisma.producto.findMany({ orderBy: { nombre: "asc" }, include: { proveedor: true } }),
    prisma.listaCompraItem.findMany({ include: { producto: { include: { proveedor: true } } }, orderBy: { createdAt: "desc" } })
  ]);

  return (
    <>
      <PageHeader title="Lista de compra" description="Productos y cantidades requeridas para comparar cotizaciones." />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>Agregar item</CardTitle></CardHeader>
          <CardContent>
            <ListaCompraForm productos={productos} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Productos pendientes</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {/* ListaAdmin is a client component handling search, sync and status updates */}
            <ListaAdmin productos={productos} lista={lista} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
