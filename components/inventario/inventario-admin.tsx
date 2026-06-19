"use client";

import { useState, useCallback, useMemo } from "react";
import { Edit3, Plus, TrendingDown, TrendingUp, History, Trash2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalEntrada } from "./modal-entrada";
import { ModalSalida } from "./modal-salida";
import { HistorialMovimientos } from "./historial-movimientos";
import { ProductoFormSimple } from "@/components/forms/producto-form-inventario";
import type { InventarioItem } from "@/lib/actions/inventario";

interface InventarioAdminProps {
  items: InventarioItem[];
}

type ModalState = {
  type: "entrada" | "salida" | "historial" | null;
  productId?: string;
  productName?: string;
  stockActual?: number;
};

export function InventarioAdmin({ items }: InventarioAdminProps) {
  const [itemsState, setItemsState] = useState<InventarioItem[]>(items || []);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return itemsState;

    return itemsState.filter((item) => {
      const text = [item.nombre, item.laboratorio, item.presentacion]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });
  }, [itemsState, searchQuery]);

  const refreshItems = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/inventario");
      if (res.ok) {
        const data = await res.json();
        setItemsState(data.items || []);
      }
    } catch (err) {
      console.error("Error refreshing inventario:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleDeleteProduct = async (product: InventarioItem) => {
    const confirmed = window.confirm(
      `¿Eliminar producto ${product.nombre}? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingProductId(product.id);
    try {
      const res = await fetch("/api/productos/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: product.id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        window.alert(data.error || "No se pudo eliminar el producto.");
        return;
      }
      await refreshItems();
    } catch (error) {
      console.error("Error deleting producto:", error);
      window.alert("Error al eliminar el producto.");
    } finally {
      setDeletingProductId(null);
    }
  };

  const openModal = (type: "entrada" | "salida" | "historial", product: InventarioItem) => {
    setModal({
      type,
      productId: product.id,
      productName: product.nombre,
      stockActual: product.stockActual
    });
  };

  const closeModal = () => {
    setModal({ type: null });
  };

  const handleMovimientoSuccess = (message: string = "Entrada de inventario registrada correctamente") => {
    refreshItems();
    setSuccessMessage(message);
  };

  const getEstadoFromStock = (stock: number) => {
    if (stock <= 2) return "critico" as const;
    if (stock <= 5) return "bajo" as const;
    return "normal" as const;
  };

  const getEstadoBadge = (estado: "normal" | "bajo" | "critico") => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      normal: "default",
      bajo: "secondary",
      critico: "destructive"
    };
    return variants[estado] || "outline";
  };

  const formatDate = (date?: Date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-ES");
  };

  const formatPrice = (price?: number) => {
    if (!price) return "-";
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Acciones rápidas */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Button
            className="gap-2 bg-amber-500 hover:bg-amber-600"
            onClick={() => setCreateProductOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Crear producto
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (itemsState.length > 0) {
                openModal("entrada", itemsState[0]);
              }
            }}
            disabled={itemsState.length === 0}
          >
            <TrendingUp className="h-4 w-4" />
            Entrada inventario
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (itemsState.length > 0) {
                openModal("salida", itemsState[0]);
              }
            }}
            disabled={itemsState.length === 0}
          >
            <TrendingDown className="h-4 w-4" />
            Salida inventario
          </Button>
          {refreshing && (
            <span className="text-sm text-slate-500">Actualizando...</span>
          )}
        </div>

        <div className="relative max-w-md">
          <Input
            type="search"
            placeholder="🔍 Buscar producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-[#E9D7C2] bg-white shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
                <TableRow className="border-b border-[#F2E3D7] bg-[#FFFBF7]">
                <TableHead className="text-slate-700">Producto</TableHead>
                <TableHead className="text-slate-700">Laboratorio</TableHead>
                <TableHead className="text-slate-700">Presentación</TableHead>
                <TableHead className="text-slate-700">Cantidad</TableHead>
                <TableHead className="text-slate-700">Última entrada</TableHead>
                <TableHead className="text-center text-slate-700">Estado</TableHead>
                <TableHead className="text-right text-slate-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  return (
                    <TableRow
                      key={item.id}
                      className={
                        getEstadoFromStock(item.stockActual) !== "normal"
                          ? "bg-[#FFF7F0]"
                          : "border-b border-[#F2E3D7]"
                      }
                    >
                      <TableCell className="font-medium text-slate-900">
                        {item.nombre}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {item.laboratorio || "-"}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {item.presentacion || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-900 font-medium">
                          {item.stockActual}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 text-sm">
                        {formatDate(item.fechaUltimaEntrada)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getEstadoBadge(
                            getEstadoFromStock(item.stockActual)
                          )}
                        >
                          {getEstadoFromStock(item.stockActual)
                            .charAt(0)
                            .toUpperCase() +
                            getEstadoFromStock(item.stockActual).slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Entrada"
                            className="h-8 w-8 p-0"
                            onClick={() => openModal("entrada", item)}
                          >
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Salida"
                            className="h-8 w-8 p-0"
                            onClick={() => openModal("salida", item)}
                          >
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Ver movimientos"
                            className="h-8 w-8 p-0"
                            onClick={() => openModal("historial", item)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Eliminar"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteProduct(item)}
                            disabled={deletingProductId === item.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-slate-500"
                  >
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {itemsState.length === 0 && (
          <div className="py-8 text-center text-slate-500">
            No hay productos en el inventario.
            <button
              type="button"
              onClick={() => setCreateProductOpen(true)}
              className="ml-2 text-amber-600 hover:underline"
            >
              Crea uno aquí
            </button>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {successMessage}
        </div>
      )}

      {/* Resumen */}
      {itemsState.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[#E9D7C2] bg-white p-4">
            <div className="text-sm text-slate-600">Total productos</div>
            <div className="text-2xl font-bold text-slate-900">{itemsState.length}</div>
          </div>
          <div className="rounded-lg border border-[#E9D7C2] bg-white p-4">
            <div className="text-sm text-slate-600">Stock bajo</div>
            <div className="text-2xl font-bold text-orange-600">
              {itemsState.filter(i => i.estado === "bajo").length}
            </div>
          </div>
          <div className="rounded-lg border border-[#E9D7C2] bg-white p-4">
            <div className="text-sm text-slate-600">Stock crítico</div>
            <div className="text-2xl font-bold text-red-600">
              {itemsState.filter(i => i.estado === "critico").length}
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {modal.type === "entrada" && modal.productId && (
        <ModalEntrada
          productId={modal.productId}
          productName={modal.productName || ""}
          isOpen={modal.type === "entrada"}
          onClose={closeModal}
          onSuccess={handleMovimientoSuccess}
        />
      )}

      {modal.type === "salida" && modal.productId && (
        <ModalSalida
          productId={modal.productId}
          productName={modal.productName || ""}
          stockActual={modal.stockActual || 0}
          isOpen={modal.type === "salida"}
          onClose={closeModal}
          onSuccess={handleMovimientoSuccess}
        />
      )}

      {modal.type === "historial" && modal.productId && (
        <HistorialMovimientos
          productId={modal.productId}
          productName={modal.productName || ""}
          isOpen={modal.type === "historial"}
          onClose={closeModal}
        />
      )}

      {createProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-3xl overflow-auto rounded-3xl border border-[#E9D7C2] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between gap-4 pb-4 sm:items-center sm:pb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Crear producto</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Agrega un producto directo desde Inventario sin salir de la página.
                </p>
              </div>
              <Button variant="ghost" onClick={() => setCreateProductOpen(false)}>
                Cerrar
              </Button>
            </div>
            <ProductoFormSimple
              onSuccess={() => {
                setCreateProductOpen(false);
                refreshItems();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
