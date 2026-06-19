"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ModalEntradaProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

const motivosEntrada = [
  "Compra proveedor",
  "Ingreso manual",
  "Ajuste de inventario",
  "Devolución cliente",
  "Corrección de stock"
];

export function ModalEntrada({
  productId,
  productName,
  isOpen,
  onClose,
  onSuccess
}: ModalEntradaProps) {
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState(motivosEntrada[0]);
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/inventario/movimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId,
          tipo: "ENTRADA",
          cantidad,
          motivo: descripcion ? `${motivo}: ${descripcion}` : motivo,
          usuario: "Sistema"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar entrada");
      }

      setCantidad(1);
      setMotivo(motivosEntrada[0]);
      setDescripcion("");
      onSuccess("Entrada de inventario registrada correctamente");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Entrada de Inventario
        </h2>
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Producto
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{productName}</p>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Registra aquí entradas de inventario. El producto ya está seleccionado y no se puede cambiar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              required
              className="border-[#E9D7C2] focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <select
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="h-10 w-full rounded-md border border-[#E9D7C2] px-3 text-sm focus:border-amber-500 focus:ring-amber-500"
            >
              {motivosEntrada.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Observación (opcional)</Label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
              className="w-full rounded-md border border-[#E9D7C2] px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar Entrada"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
