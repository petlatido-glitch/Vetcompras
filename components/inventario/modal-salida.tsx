"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ModalSalidaProps {
  productId: string;
  productName: string;
  stockActual: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

const motivosSalida = [
  "Consulta",
  "Cirugía",
  "Hospitalización",
  "Venta",
  "Ajuste de inventario"
];

export function ModalSalida({
  productId,
  productName,
  stockActual,
  isOpen,
  onClose,
  onSuccess
}: ModalSalidaProps) {
  const [cantidad, setCantidad] = useState<number>(stockActual > 0 ? 1 : 0);
  const [motivo, setMotivo] = useState(motivosSalida[0]);
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stockActual <= 0) {
      setError("No hay stock disponible para realizar la salida.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/inventario/movimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId,
          tipo: "SALIDA",
          cantidad,
          motivo: descripcion ? `${motivo}: ${descripcion}` : motivo,
          usuario: "Sistema"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar salida");
      }

      setCantidad(1);
      setMotivo(motivosSalida[0]);
      setDescripcion("");
      onSuccess("Salida de inventario registrada correctamente");
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
          Salida de Inventario
        </h2>
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Producto
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{productName}</p>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Registra aquí la salida de inventario. El producto ya está seleccionado y no se puede cambiar.
        </p>
        <p className="mb-6 text-sm font-semibold text-slate-700">
          Stock disponible: {stockActual}
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
              max={stockActual}
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Math.min(Number(e.target.value), stockActual)))}
              required
              disabled={stockActual <= 0}
              className="border-[#E9D7C2] focus:border-amber-500 focus:ring-amber-500"
            />
            <p className="text-xs text-slate-500">
              Máximo disponible: {stockActual}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <select
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="h-10 w-full rounded-md border border-[#E9D7C2] px-3 text-sm focus:border-amber-500 focus:ring-amber-500"
            >
              {motivosSalida.map((m) => (
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
              className="bg-red-500 hover:bg-red-600"
              disabled={loading || stockActual <= 0}
            >
              {loading ? "Guardando..." : "Guardar Salida"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
