"use client";

import { useMemo, useState } from "react";
import { Edit3, Filter, Search, Trash2, X } from "lucide-react";
import { ProductoForm } from "@/components/forms/producto-form";
import { Button } from "@/components/ui/button";
import { categorias, estadosProducto, unidades } from "@/lib/validators/catalogos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteProducto } from "@/lib/actions/catalogos";
import { formatCurrency } from "@/lib/utils";

interface ProveedorOption {
  id: string;
  nombre: string;
}

export interface ProductoAdminItem {
  id: string;
  nombre: string;
  categoria: (typeof categorias)[number];
  marca?: string | null;
  laboratorio?: string | null;
  proveedorId?: string | null;
  proveedor?: { id: string; nombre: string } | null;
  sku?: string | null;
  unidad: (typeof unidades)[number];
  presentacion?: string | null;
  precioCompra?: string | null;
  precioSugerido?: string | null;
  ultimoCosto?: string | null;
  lote?: string | null;
  fechaVencimiento?: string | null;
  observaciones?: string | null;
  stockActual: number;
  stockMinimo: number;
  estado?: (typeof estadosProducto)[number];
}

interface ProductosAdminProps {
  products: ProductoAdminItem[];
  providers: ProveedorOption[];
}

export function ProductosAdmin({ products, providers }: ProductosAdminProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductoAdminItem | null>(null);

  function normalizeForForm(p: ProductoAdminItem) {
    return {
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      marca: p.marca ?? undefined,
      laboratorio: p.laboratorio ?? undefined,
      proveedorId: p.proveedorId ?? undefined,
      sku: p.sku ?? undefined,
      unidad: p.unidad as (typeof unidades)[number],
      presentacion: p.presentacion ?? undefined,
      precioCompra: p.precioCompra ?? undefined,
      precioSugerido: p.precioSugerido ?? undefined,
      ultimoCosto: p.ultimoCosto ?? undefined,
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      lote: p.lote ?? undefined,
      fechaVencimiento: p.fechaVencimiento ?? undefined,
      observaciones: p.observaciones ?? undefined,
      estado: p.estado ?? "ACTIVO"
    };
  }

  const filteredProducts = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return products.filter((product) => {
      const matchesQuery =
        !normalized ||
        product.nombre.toLowerCase().includes(normalized) ||
        product.categoria.toLowerCase().includes(normalized) ||
        product.unidad.toLowerCase().includes(normalized) ||
        product.proveedor?.nombre.toLowerCase().includes(normalized) ||
        product.sku?.toLowerCase().includes(normalized) ||
        product.presentacion?.toLowerCase().includes(normalized) ||
        product.lote?.toLowerCase().includes(normalized) ||
        product.observaciones?.toLowerCase().includes(normalized);

      const matchesCategory = !categoryFilter || product.categoria === categoryFilter;
      const matchesStatus = !statusFilter || product.estado === statusFilter;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, query, categoryFilter, statusFilter]);

  return (
    <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader className="flex items-center justify-between gap-4">
          <CardTitle>{selectedProduct ? "Editar producto" : "Nuevo producto"}</CardTitle>
          {selectedProduct ? (
            <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </CardHeader>
          <CardContent>
          <ProductoForm product={selectedProduct ? normalizeForForm(selectedProduct) : undefined} providers={providers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Inventario de productos</CardTitle>
              <p className="text-sm text-slate-500">Busca, edita o elimina productos existentes.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar producto, categoría, proveedor, SKU, lote..."
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-10 rounded-md border bg-white px-3 text-sm text-slate-700"
                >
                  <option value="">Todas las categorías</option>
                  <option value="MEDICAMENTOS">Medicamentos</option>
                  <option value="ANTIPARASITARIO">Antiparasitarios</option>
                  <option value="ALIMENTO">Alimentos</option>
                  <option value="INSUMO_MEDICO">Insumos médicos</option>
                  <option value="HOSPITALARIO">Hospitalarios</option>
                  <option value="VACUNAS">Vacunas</option>
                  <option value="JUGUETES">Juguetes</option>
                  <option value="ACCESORIOS">Accesorios</option>
                  <option value="OTRO">Otro</option>
                  <option value="CONCENTRADOS">Concentrados</option>
                  <option value="INSUMOS">Insumos</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-md border bg-white px-3 text-sm text-slate-700"
                >
                  <option value="">Todos los estados</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>
              <div className="rounded-full bg-[#FFFAF7] px-3 py-2 text-sm text-slate-600 shadow-sm">
                {filteredProducts.length} productos
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Presentación</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Precio compra</TableHead>
                <TableHead>Precio sugerido</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const lowStock = product.stockActual <= product.stockMinimo;
                return (
                  <TableRow key={product.id} className={lowStock ? "bg-[#FFF7F0]" : undefined}>
                    <TableCell className="font-medium">
                      <div>{product.nombre}</div>
                      <div className="mt-1 text-xs text-slate-500">{product.categoria.replace(/_/g, " ")}</div>
                    </TableCell>
                    <TableCell>{product.presentacion ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{product.stockActual} / {product.stockMinimo}</span>
                        {lowStock ? (
                          <span className="rounded-full bg-[#FFE8D4] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D86F36]">
                            Bajo stock
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{product.precioCompra ? formatCurrency(Number(product.precioCompra)) : "-"}</TableCell>
                    <TableCell>{product.precioSugerido ? formatCurrency(Number(product.precioSugerido)) : "-"}</TableCell>
                    <TableCell>{product.proveedor?.nombre ?? "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" type="button" title="Editar" onClick={() => setSelectedProduct(product)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <form action={deleteProducto.bind(null, product.id)}>
                        <Button variant="ghost" size="icon" title="Eliminar">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </form>
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
