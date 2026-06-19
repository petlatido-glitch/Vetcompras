"use client";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

type ComparisonRow = {
  proveedor: string;
  producto: string;
  presentacion: string;
  precio: number;
  fechaCotizacion: string;
  isBest: boolean;
  diffPercent: number;
};

type ComparisonResult = {
  query: string;
  items: ComparisonRow[];
  minPrecio: number;
};

export default function PriceCompare() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<number, { checked: boolean; cantidad: number; observacion?: string }>>({});
  const [ordersPreview, setOrdersPreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  async function runCompare() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/comparison/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al buscar cotizaciones");
      setResult(data);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function toggleRow(index: number) {
    setSelected((s) => ({ ...s, [index]: { checked: !(s[index]?.checked ?? false), cantidad: s[index]?.cantidad ?? 1, observacion: s[index]?.observacion } }));
  }

  function setCantidad(index: number, cantidad: number) {
    setSelected((s) => ({ ...s, [index]: { checked: s[index]?.checked ?? true, cantidad: cantidad || 1, observacion: s[index]?.observacion } }));
  }

  function setObservacion(index: number, obs: string) {
    setSelected((s) => ({ ...s, [index]: { checked: s[index]?.checked ?? true, cantidad: s[index]?.cantidad ?? 1, observacion: obs } }));
  }

  async function generatePreview() {
    if (!result) return;
    const items = result.items
      .map((it, idx) => ({ it, idx }))
      .filter(({ idx }) => selected[idx]?.checked)
      .map(({ it, idx }) => ({
        proveedor: it.proveedor,
        producto: it.producto,
        presentacion: it.presentacion,
        precio: it.precio,
        fechaCotizacion: it.fechaCotizacion,
        cantidad: Number(selected[idx]?.cantidad ?? 1),
        observacion: selected[idx]?.observacion ?? null
      }));

    if (items.length === 0) return;

    try {
      setPreviewLoading(true);
      const res = await fetch("/api/ordenes/generate-from-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error generando vista previa");
      setOrdersPreview(data);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    setOrdersPreview(null);
  }

  return (
    <div className="rounded-3xl border border-[#E9D7C2] bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-slate-700">🔍 Buscar producto</label>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre genérico, comercial o presentación"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white"
          />
        </div>

        <button
          type="button"
          disabled={loading || !query.trim()}
          onClick={runCompare}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {result && (
        <div className="space-y-4">
          {result.items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              No existen cotizaciones para este producto
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FFFBF7] text-left text-slate-700">
                      <th className="px-4 py-3">Sel.</th>
                    <th className="px-4 py-3">Proveedor</th>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Presentación</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Fecha cotización</th>
                    <th className="px-4 py-3 text-right">Dif. %</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item, index) => (
                      <tr key={`${item.proveedor}-${index}`} className={item.isBest ? "bg-[#ECFDF5] font-semibold" : index % 2 === 0 ? "bg-white" : "bg-[#FEF5E9]"}>
                        <td className="border-t border-slate-200 px-4 py-3">
                          <input type="checkbox" checked={!!selected[index]?.checked} onChange={() => toggleRow(index)} />
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3">{item.proveedor}</td>
                        <td className="border-t border-slate-200 px-4 py-3">{item.producto}</td>
                        <td className="border-t border-slate-200 px-4 py-3">{item.presentacion}</td>
                        <td className="border-t border-slate-200 px-4 py-3">{formatCurrency(item.precio)}</td>
                        <td className="border-t border-slate-200 px-4 py-3">{formatDate(item.fechaCotizacion)}</td>
                        <td className="border-t border-slate-200 px-4 py-3 text-right text-slate-700">
                          {item.isBest ? "Precio más bajo" : `${item.diffPercent.toFixed(1)} %`}
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

        {/* selection controls */}
        {result && result.items.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 text-sm text-slate-700">Para cada fila seleccionada puedes ajustar la cantidad y observación en la vista previa.</div>
              <div className="flex gap-2">
                <button type="button" onClick={generatePreview} disabled={previewLoading} className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white">
                  {previewLoading ? 'Generando...' : 'Generar órdenes (vista previa)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders preview modal */}
        {ordersPreview && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
            <div className="absolute inset-0 bg-black/40" onClick={closePreview} />
            <div className="relative z-10 w-full max-w-4xl overflow-auto rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold">Vista previa de órdenes</h3>
              <div className="space-y-6">
                {ordersPreview.orders.map((order: any, oi: number) => (
                  <div key={oi} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium">Proveedor: {order.proveedor}</div>
                      <div className="text-sm font-semibold">Total: {formatCurrency(order.total)}</div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-600">
                          <th className="px-2">Producto</th>
                          <th className="px-2">Cantidad</th>
                          <th className="px-2">Precio unitario</th>
                          <th className="px-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((it: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-2">{it.producto} {it.presentacion ? `(${it.presentacion})` : ''}</td>
                            <td className="px-2 py-2">{it.cantidad}</td>
                            <td className="px-2 py-2">{formatCurrency(it.precioUnitario)}</td>
                            <td className="px-2 py-2">{formatCurrency(it.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                <div className="flex items-center justify-end gap-4">
                  <div className="text-sm font-semibold">Total general: {formatCurrency(ordersPreview.totalGeneral)}</div>
                  <button className="rounded-xl bg-slate-200 px-4 py-2" onClick={closePreview}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
