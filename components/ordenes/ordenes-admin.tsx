"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowUpRight, CalendarDays, Edit3, Plus, Search, Trash2, Truck, Upload } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  BORRADOR: "Pendiente",
  GENERADA: "Pendiente",
  ENVIADA: "Enviada",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada"
};

const ORDER_STATUSES = ["GENERADA", "ENVIADA", "RECIBIDA", "CANCELADA"] as const;

type ProductoOption = {
  id: string;
  nombre: string;
};

type ProveedorOption = {
  id: string;
  nombre: string;
  telefono?: string | null;
};

type OrdenItem = {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
};

type OrdenItemRow = {
  id: string;
  producto: ProductoOption;
  cantidad: number;
  precioUnitario: string;
};

type OrdenCompraRow = {
  id: string;
  compraId: string;
  compra: { id: string; estado: string; createdAt: string };
  proveedor: ProveedorOption;
  mensajeWhatsapp: string;
  items: Array<{ id: string; producto: ProductoOption; cantidad: number; precioUnitario: string }>;
};

export function OrdenesCompraAdmin({ ordenes, providers, products }: { ordenes: OrdenCompraRow[]; providers: ProveedorOption[]; products: ProductoOption[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState<"all" | "30" | "90" | "365">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredOrders = useMemo(() => {
    const normalized = search.toLowerCase().trim();
    const cutoff = (() => {
      const now = new Date();
      if (dateRange === "30") return new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
      if (dateRange === "90") return new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90);
      if (dateRange === "365") return new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365);
      return null;
    })();

    return ordenes.filter((orden) => {
      if (providerFilter && orden.proveedor.id !== providerFilter) return false;
      if (statusFilter && orden.compra.estado !== statusFilter) return false;
      if (cutoff && new Date(orden.compra.createdAt) < cutoff) return false;

      if (!normalized) return true;
      const searchIn = [orden.proveedor.nombre, orden.id, orden.compra.estado].join(" ").toLowerCase();
      const matchProvider = orden.proveedor.nombre.toLowerCase().includes(normalized);
      const matchOrder = orden.id.toLowerCase().includes(normalized);
      const matchProduct = orden.items.some((item) => item.producto.nombre.toLowerCase().includes(normalized));
      return matchProvider || matchOrder || matchProduct || searchIn.includes(normalized);
    });
  }, [ordenes, search, providerFilter, statusFilter, dateRange]);

  const totalPurchase = useMemo(
    () => filteredOrders.reduce((sum, orden) => sum + orden.items.reduce((sub, item) => sub + Number(item.precioUnitario) * item.cantidad, 0), 0),
    [filteredOrders]
  );

  const selectedOrder = editingOrderId ? ordenes.find((orden) => orden.id === editingOrderId) ?? null : null;

  async function handleDelete(id: string) {
    if (!window.confirm("Eliminar esta orden de compra?")) return;
    try {
      const response = await fetch("/api/ordenes-compra/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "No se pudo eliminar la orden.");
      setActionMessage({ type: "success", text: "Orden eliminada correctamente." });
      router.refresh();
    } catch (error: any) {
      setActionMessage({ type: "error", text: error?.message ?? "Error al eliminar orden." });
    }
  }

  async function handleStatusChange(compraId: string, estado: string) {
    try {
      const response = await fetch("/api/ordenes-compra/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compraId, estado })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "No se pudo actualizar el estado.");
      setActionMessage({ type: "success", text: "Estado actualizado." });
      router.refresh();
    } catch (error: any) {
      setActionMessage({ type: "error", text: error?.message ?? "Error al actualizar estado." });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Ordenes de compra</CardTitle>
              <p className="text-sm text-slate-500">Administra órdenes, proveedores y estados sin alterar productos ni cotizaciones.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setShowForm(true); setEditingOrderId(null); setActionMessage(null); }}>
                <Plus className="h-4 w-4" /> Nueva orden
              </Button>
              <span className="rounded-full bg-[#FFFBF6] px-3 py-2 text-sm text-slate-600 shadow-sm">{filteredOrders.length} ordenes</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-[#F4E2D4] bg-[#FFFBF7] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total estimado</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(totalPurchase)}</p>
              </div>
              <div className="rounded-3xl border border-[#E9E2E9] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Proveedores</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{new Set(filteredOrders.map((orden) => orden.proveedor.id)).size}</p>
              </div>
              <div className="rounded-3xl border border-[#E9E2E9] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Productos en orden</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{new Set(filteredOrders.flatMap((orden) => orden.items.map((item) => item.producto.id))).size}</p>
              </div>
              <div className="rounded-3xl border border-[#E9E2E9] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Estados</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{new Set(filteredOrders.map((orden) => STATUS_LABELS[orden.compra.estado] ?? orden.compra.estado)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Producto, proveedor o orden..." className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
                <option value="">Todos los proveedores</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>{provider.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Todos los estados</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>{STATUS_LABELS[status] ?? status}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={dateRange} onChange={(event) => setDateRange(event.target.value as typeof dateRange)}>
                <option value="all">Todos los periodos</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
                <option value="365">Último año</option>
              </select>
            </div>
            <Button variant="secondary" size="sm" onClick={() => { setSearch(""); setProviderFilter(""); setStatusFilter(""); setDateRange("all"); }}>
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      </div>

      {showForm ? (
        <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{editingOrderId ? "Editar orden" : "Nueva orden de compra"}</CardTitle>
              <p className="text-sm text-slate-500">Crea o actualiza una orden con múltiples productos, cantidades y total estimado.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingOrderId(null); setActionMessage(null); }}>
              Cancelar
            </Button>
          </CardHeader>
          <CardContent>
            <OrdenCompraForm
              providers={providers}
              products={products}
              existingOrder={selectedOrder}
              onSaved={() => {
                setShowForm(false);
                setEditingOrderId(null);
                setActionMessage({ type: "success", text: editingOrderId ? "Orden actualizada." : "Orden creada." });
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {actionMessage ? (
        <div className={`rounded-2xl p-4 text-sm ${actionMessage.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{actionMessage.text}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Listado de ordenes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total estimado</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((orden) => {
                const total = orden.items.reduce((sum, item) => sum + Number(item.precioUnitario) * item.cantidad, 0);
                return (
                  <TableRow key={orden.id}>
                    <TableCell className="font-medium">{orden.proveedor.nombre}</TableCell>
                    <TableCell>{formatDate(orden.compra.createdAt)}</TableCell>
                    <TableCell>{STATUS_LABELS[orden.compra.estado] ?? orden.compra.estado}</TableCell>
                    <TableCell>{formatCurrency(total)}</TableCell>
                    <TableCell>{orden.items.map((item) => `${item.producto.nombre} x${item.cantidad}`).join(", ")}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" type="button" title="Editar" onClick={() => { setEditingOrderId(orden.id); setShowForm(true); setActionMessage(null); }}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" type="button" title="Eliminar" onClick={() => handleDelete(orden.id)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                      <div className="inline-flex items-center gap-1 rounded-full border border-[#E9E2E9] bg-[#FCFCFC] px-2 py-1 text-xs text-slate-600">
                        <CalendarDays className="h-3.5 w-3.5" /> {orden.compra.id}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdenCompraForm({ providers, products, existingOrder, onSaved }: { providers: ProveedorOption[]; products: ProductoOption[]; existingOrder: OrdenCompraRow | null; onSaved: () => void }) {
  const router = useRouter();
  const [proveedorId, setProveedorId] = useState(existingOrder?.proveedor.id ?? providers[0]?.id ?? "");
  const [estado, setEstado] = useState(existingOrder?.compra.estado ?? "GENERADA");
  const [items, setItems] = useState<OrdenItemRow[]>(
    existingOrder?.items.map((item) => ({ id: item.id, producto: item.producto, cantidad: item.cantidad, precioUnitario: item.precioUnitario })) ??
      [{ id: "0", producto: products[0] ?? { id: "", nombre: "" }, cantidad: 1, precioUnitario: "0" }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProveedorId(existingOrder?.proveedor.id ?? providers[0]?.id ?? "");
    setEstado(existingOrder?.compra.estado ?? "GENERADA");
    setItems(
      existingOrder?.items.map((item) => ({ id: item.id, producto: item.producto, cantidad: item.cantidad, precioUnitario: item.precioUnitario })) ??
        [{ id: "0", producto: products[0] ?? { id: "", nombre: "" }, cantidad: 1, precioUnitario: "0" }]
    );
  }, [existingOrder, products, providers]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.cantidad) * Number(item.precioUnitario || 0), 0),
    [items]
  );

  function updateItem(index: number, key: keyof OrdenItemRow, value: string | number) {
    setItems((current) =>
      current.map((item, idx) => {
        if (idx !== index) return item;
        if (key === "producto") {
          return { ...item, producto: products.find((product) => product.id === String(value)) ?? item.producto };
        }
        return { ...item, [key]: value } as OrdenItemRow;
      })
    );
  }

  function addItem() {
    setItems((current) => [...current, { id: String(current.length + 1), producto: products[0] ?? { id: "", nombre: "" }, cantidad: 1, precioUnitario: "0" }]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, idx) => idx !== index));
  }

  async function handleSave() {
    if (!proveedorId) {
      setError("Seleccione un proveedor.");
      return;
    }
    const cleanItems = items
      .filter((item) => item.producto.id && item.cantidad > 0 && Number(item.precioUnitario) >= 0)
      .map((item) => ({ productoId: item.producto.id, cantidad: item.cantidad, precioUnitario: Number(item.precioUnitario) }));
    if (!cleanItems.length) {
      setError("Agrega al menos un producto con cantidad y precio.");
      return;
    }
    setLoading(true);
    setError(null);

    const mensajeWhatsapp = `Hola ${providers.find((provider) => provider.id === proveedorId)?.nombre ?? ""}, queremos realizar el siguiente pedido:\n${cleanItems
      .map((item) => `- ${products.find((product) => product.id === item.productoId)?.nombre ?? "Producto"}: ${item.cantidad} x ${formatCurrency(item.precioUnitario)}`)
      .join("\n")}\nTotal estimado: ${formatCurrency(total)}`;

    try {
      const response = await fetch("/api/ordenes-compra/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existingOrder?.id,
          compraId: existingOrder?.compra.id,
          proveedorId,
          estado,
          items: cleanItems,
          mensajeWhatsapp
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Error guardando la orden.");
      onSaved();
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "No se pudo guardar la orden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Proveedor</Label>
          <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={proveedorId} onChange={(event) => setProveedorId(event.target.value)}>
            <option value="">Selecciona un proveedor</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>{provider.nombre}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={estado} onChange={(event) => setEstado(event.target.value)}>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status] ?? status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Productos de la orden</CardTitle>
            <p className="text-sm text-slate-500">Agrega los productos y los precios unitarios estimados.</p>
          </div>
          <Button variant="outline" size="sm" type="button" onClick={addItem}>
            <Plus className="h-4 w-4" /> Agregar producto
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="grid gap-3 rounded-3xl border border-[#EAE6E1] bg-[#FFFCF9] p-4 sm:grid-cols-[1fr_160px_160px_90px]">
              <div className="space-y-2">
                <Label>Producto</Label>
                <select value={item.producto.id} className="h-10 w-full rounded-md border bg-white px-3 text-sm" onChange={(event) => updateItem(index, "producto", event.target.value)}>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" min="1" value={item.cantidad} onChange={(event) => updateItem(index, "cantidad", Number(event.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Precio unitario</Label>
                <Input type="number" min="0" step="0.01" value={item.precioUnitario} onChange={(event) => updateItem(index, "precioUnitario", event.target.value)} />
              </div>
              <div className="flex items-end justify-end">
                <Button variant="ghost" size="icon" type="button" onClick={() => removeItem(index)}>
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-[#E9E2E2] bg-[#FFFCF9] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Total estimado</p>
            <p className="text-3xl font-semibold text-slate-900">{formatCurrency(total)}</p>
          </div>
          <div className="text-right text-sm text-slate-500"><Truck className="inline h-4 w-4 align-text-bottom text-slate-400" /> El total se calcula automáticamente</div>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onSaved} type="button">Cerrar</Button>
        <Button onClick={handleSave} disabled={loading}>{loading ? "Guardando..." : existingOrder ? "Actualizar orden" : "Crear orden"}</Button>
      </div>
    </div>
  );
}
