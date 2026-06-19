import { PageHeader } from "@/components/app/page-header";
import { InventarioAdmin } from "@/components/inventario/inventario-admin";
import { getInventario } from "@/lib/actions/inventario";

export default async function InventarioPage() {
  const items = await getInventario();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventario"
        description="Gestiona el inventario de productos y realiza seguimiento de stock"
      />
      <InventarioAdmin items={items} />
    </div>
  );
}
