import { PageHeader } from "@/components/app/page-header";
import { ProveedoresAdmin } from "@/components/providers/proveedores-admin";
import { prisma } from "@/lib/prisma";

export default async function ProveedoresPage() {
  const proveedores = await prisma.proveedor.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } }
  });

  return (
    <>
      <PageHeader title="Proveedores" description="Contactos comerciales para cotizaciones y ordenes de compra." />
      <ProveedoresAdmin providers={proveedores} />
    </>
  );
}
