"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { MovimientoItem } from "@/lib/actions/inventario";

interface HistorialMovimientosProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function HistorialMovimientos({
  productId,
  productName,
  isOpen,
  onClose
}: HistorialMovimientosProps) {
  const [movimientos, setMovimientos] = useState<MovimientoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMovimientos();
    }
  }, [isOpen, productId]);

  const fetchMovimientos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventario/movimientos?productoId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setMovimientos(data.movimientos || []);
      }
    } catch (err) {
      console.error("Error fetching movimientos:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ENTRADA: "default",
      SALIDA: "destructive",
      AJUSTE: "secondary",
      COMPRA: "default",
      USO_CLINICO: "destructive",
      MERMA: "secondary"
    };
    return variants[tipo] || "outline";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Historial de Movimientos
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="mb-4 text-sm text-slate-600">{productName}</p>

        {loading ? (
          <div className="py-8 text-center text-slate-500">
            Cargando movimientos...
          </div>
        ) : movimientos.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No hay movimientos registrados para este producto
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#E9D7C2]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#F2E3D7] bg-[#FFFBF7]">
                  <TableHead className="text-slate-700">Fecha</TableHead>
                  <TableHead className="text-center text-slate-700">Tipo</TableHead>
                  <TableHead className="text-center text-slate-700">Cantidad</TableHead>
                  <TableHead className="text-center text-slate-700">Antes</TableHead>
                  <TableHead className="text-center text-slate-700">Después</TableHead>
                  <TableHead className="text-slate-700">Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((mov) => (
                  <TableRow key={mov.id} className="border-b border-[#F2E3D7]">
                    <TableCell className="text-sm text-slate-700">
                      {formatDate(mov.fecha)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getTipoBadge(mov.tipo)}>
                        {mov.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-slate-900">
                      {mov.cantidad}
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {mov.cantidadAntes}
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {mov.cantidadDespues}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {mov.motivo || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} className="bg-amber-500 hover:bg-amber-600">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
