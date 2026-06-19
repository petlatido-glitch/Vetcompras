import { PageHeader } from "@/components/app/page-header";
import { prisma } from "@/lib/prisma";
import { OrdenesCompraAdmin } from "@/components/ordenes/ordenes-admin";

export default async function OrdenesCompraPage() {
  const [providers, products, ordenes] = await Promise.all([
    prisma.proveedor.findMany({ select: { id: true, nombre: true, telefono: true } }),
    prisma.producto.findMany({ select: { id: true, nombre: true } }),
    prisma.ordenCompra.findMany({
      include: { proveedor: true, compra: true, items: { include: { producto: true } } },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <>
      <PageHeader title="Ordenes de compra" description="Administra órdenes con proveedor, múltiples productos, cantidades y estado de envío." />
      <OrdenesCompraAdmin ordenes={ordenes} providers={providers} products={products} />
    </>
  );
}
