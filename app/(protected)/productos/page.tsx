import { PageHeader } from "@/components/app/page-header";
import { ProductosAdmin, type ProductoAdminItem } from "@/components/products/productos-admin";
import { prisma } from "@/lib/prisma";
import { unidades } from "@/lib/validators/catalogos";

export default async function ProductosPage() {
  const [productos, proveedores] = await Promise.all([
    prisma.producto.findMany({ orderBy: { nombre: "asc" } }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } })
  ]);

  const providersMap = new Map(proveedores.map((p) => [p.id, { id: p.id, nombre: p.nombre }]));

  const productosData: ProductoAdminItem[] = productos.map((producto) => ({
    ...producto,
    unidad: producto.unidad as (typeof unidades)[number],
    proveedor: producto.proveedorId ? providersMap.get(producto.proveedorId) ?? null : null,
    precioCompra: producto.precioCompra?.toString() ?? undefined,
    precioSugerido: producto.precioSugerido?.toString() ?? undefined,
    ultimoCosto: producto.ultimoCosto?.toString() ?? undefined,
    fechaVencimiento: producto.fechaVencimiento ? producto.fechaVencimiento.toISOString().slice(0, 10) : undefined
  }));

  return (
    <>
      <PageHeader title="Productos" description="Catalogo de medicamentos, concentrados, insumos, vacunas y accesorios." />
      <ProductosAdmin products={productosData} providers={proveedores} />
    </>
  );
}
