import { PageHeader } from "@/components/app/page-header";
import { prisma } from "@/lib/prisma";
import { OrdenesCompraAdmin } from "@/components/ordenes/ordenes-admin";
import { serializeForClientAny } from "@/lib/serialize";

export default async function OrdenesCompraPage() {
  const [providers, products, ordenes] = await Promise.all([
    prisma.proveedor.findMany({ select: { id: true, nombre: true, telefono: true } }),
    prisma.producto.findMany({ select: { id: true, nombre: true } }),
    prisma.ordenCompra.findMany({
      include: { proveedor: true, compra: true, items: { include: { producto: true } } },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const serializableOrdenes = serializeForClientAny(ordenes);
  const serializableProviders = serializeForClientAny(providers);
  const serializableProducts = serializeForClientAny(products);

  return (
    <>
      <PageHeader title="Ordenes de compra" description="Administra órdenes con proveedor, múltiples productos, cantidades y estado de envío." />
      <OrdenesCompraAdmin ordenes={serializableOrdenes} providers={serializableProviders} products={serializableProducts} />
    </>
  );
}
