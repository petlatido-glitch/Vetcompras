"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

type CotizacionItem = {
  id?: string;
  nombreDetectado: string;
  nombreOcr?: string;
  nombreGenerico?: string;
  laboratorio?: string;
  cantidad?: number | string | null;
  cantidadUnidad?: string;
  precio: number | string;
  precioUnitario?: number | string;
  precioTotal?: number | string;
  presentacion?: string;
  productoId?: string;
};

type CotizacionDetail = {
  id: string;
  proveedor: { id: string; nombre: string };
  fecha: string;
  archivoNombre: string;
  items: CotizacionItem[];
};

type Props = {
  cotizacion: CotizacionDetail;
  onClose: () => void;
  onSaved?: () => void;
};

export function CotizacionDetailModal({ cotizacion, onClose, onSaved }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<CotizacionItem[]>(() =>
    cotizacion.items.map((item) => ({
      ...item,
      cantidad: item.cantidad != null ? safeNumber(item.cantidad) : undefined,
      precio: safeNumber(item.precio),
      precioUnitario: item.precioUnitario != null ? safeNumber(item.precioUnitario) : undefined,
      precioTotal: item.precioTotal != null ? safeNumber(item.precioTotal) : undefined
    }))
  );
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function safeNumber(value: string | number | undefined) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const text = String(value ?? "").trim();
    if (!text) return 0;

    const hasDot = text.includes(".");
    const hasComma = text.includes(",");
    let normalized = text.replace(/\s+/g, "");

    if (hasDot && hasComma) {
      if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
        normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
      } else {
        normalized = normalized.replace(/,/g, "");
      }
    } else if (hasComma) {
      normalized = normalized.replace(/,/g, ".");
    } else if ((normalized.match(/\./g) || []).length > 1) {
      normalized = normalized.replace(/\./g, "");
    }

    const numberValue = Number(normalized.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  function updateItem(index: number, field: keyof CotizacionItem) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const parsedValue =
        field === "precio" || field === "cantidad"
          ? safeNumber(rawValue)
          : rawValue;

      setItems((current) =>
        current.map((item, idx) =>
          idx === index ? { ...item, [field]: parsedValue } : item
        )
      );
    };
  }

  function deleteItem(index: number) {
    setItems((current) => current.filter((_, idx) => idx !== index));
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        nombreDetectado: "",
        precio: 0,
        presentacion: "",
        laboratorio: "",
        cantidadUnidad: undefined,
        cantidad: undefined,
        nombreOcr: "",
        nombreGenerico: ""
      }
    ]);
  }

  async function handleSaveChanges() {
    if (items.length === 0) {
      setMessage({ type: "error", text: "Debe haber al menos un producto." });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      const body = {
        cotizacionId: cotizacion.id,
        items: items.map((item) => ({
          id: item.id,
          productoId: item.productoId,
          nombreDetectado: item.nombreDetectado,
          nombreOCR: item.nombreOcr,
          nombreGenerico: item.nombreGenerico,
          laboratorio: item.laboratorio,
          cantidad: typeof item.cantidad === "string" ? safeNumber(item.cantidad) : item.cantidad,
          cantidadUnidad: item.cantidadUnidad,
          precio: typeof item.precio === "string" ? safeNumber(item.precio) : item.precio,
          presentacion: item.presentacion
        }))
      };

      const response = await fetch("/api/cotizaciones/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || "No se pudieron guardar los cambios.");
      }

      setMessage({ type: "success", text: "Cambios guardados correctamente." });
      setTimeout(() => {
        router.refresh();
        onSaved?.();
        onClose();
      }, 500);
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "Error guardando los cambios." });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center">
      <Card className="w-full sm:max-h-[90vh] sm:max-w-4xl overflow-y-auto rounded-b-none sm:rounded-b-lg">
        <CardHeader className="sticky top-0 z-10 flex items-center justify-between border-b bg-white">
          <div>
            <CardTitle>Editar Cotización</CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              {cotizacion.proveedor.nombre} • {formatDate(cotizacion.fecha)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="grid gap-4">
            {items.map((item, index) => (
              <div key={index} className="rounded-[1.5rem] border border-orange-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="w-full space-y-2">
                    <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-900 shadow-sm">
                      Nombre detectado
                    </span>
                    <Input
                      value={item.nombreDetectado}
                      onChange={updateItem(index, "nombreDetectado")}
                      placeholder="Ej: Ampicilina + Sulbactam"
                      className="border-orange-300 bg-orange-50 text-slate-900 font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                    onClick={() => deleteItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />Eliminar
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-900 shadow-sm">
                      Nombre genérico
                    </span>
                    <Input
                      value={item.nombreGenerico ?? ""}
                      onChange={updateItem(index, "nombreGenerico")}
                      placeholder="Nombre genérico"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-900 shadow-sm">
                      Presentación
                    </span>
                    <Input
                      value={item.presentacion ?? ""}
                      onChange={updateItem(index, "presentacion")}
                      placeholder="Presentación"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-900 shadow-sm">
                      Laboratorio / Marca
                    </span>
                    <Input
                      value={item.laboratorio ?? ""}
                      onChange={updateItem(index, "laboratorio")}
                      placeholder="Laboratorio / Marca"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-900 shadow-sm">
                      Cantidad
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={item.cantidad ?? ""}
                      onChange={updateItem(index, "cantidad")}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-900 shadow-sm">
                      Precio
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precio?.toString() ?? ""}
                      onChange={updateItem(index, "precio")}
                      placeholder="0"
                      className="border-orange-400 bg-orange-50 text-slate-900 font-semibold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[1.25rem] border border-orange-200 bg-orange-50 p-4 text-sm text-slate-700 shadow-sm shadow-slate-900/5">
            <p className="font-semibold text-slate-900">Resumen de cotización</p>
            <p className="mt-2">Total de productos: <span className="font-semibold">{items.length}</span></p>
            <p className="mt-1">Valor total estimado: <span className="font-semibold">{formatCurrency(items.reduce((sum, item) => sum + safeNumber(item.precio), 0))}</span></p>
          </div>

          {message && (
            <div
              className={`rounded-md px-4 py-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              onClick={addItem}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar producto
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={processing}
              className="ml-auto bg-orange-500 hover:bg-orange-600"
            >
              {processing ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={processing}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
