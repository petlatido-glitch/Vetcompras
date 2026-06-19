"use client";

import { useMemo, useState } from "react";
import { Trash2, Edit3, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProveedorForm } from "@/components/forms/proveedor-form";
import { estadosProveedor, categoriasProveedor } from "@/lib/validators/catalogos";
import { useRouter } from "next/navigation";

export interface ProveedorAdminItem {
  id: string;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  categoria: (typeof categoriasProveedor)[number];
  estado: (typeof estadosProveedor)[number];
  notas?: string | null;
  _count: {
    productos: number;
  };
}

interface ProveedoresAdminProps {
  providers: ProveedorAdminItem[];
}

export function ProveedoresAdmin({ providers }: ProveedoresAdminProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ProveedorAdminItem | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredProviders = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return providers.filter((provider) => {
      const matchesQuery =
        !normalized ||
        provider.nombre.toLowerCase().includes(normalized) ||
        provider.contacto?.toLowerCase().includes(normalized) ||
        provider.telefono?.toLowerCase().includes(normalized) ||
        provider.whatsapp?.toLowerCase().includes(normalized) ||
        provider.email?.toLowerCase().includes(normalized) ||
        provider.ciudad?.toLowerCase().includes(normalized) ||
        provider.direccion?.toLowerCase().includes(normalized) ||
        provider.categoria.toLowerCase().includes(normalized) ||
        provider.notas?.toLowerCase().includes(normalized);

      const matchesCategory = !categoryFilter || provider.categoria === categoryFilter;
      const matchesStatus = !statusFilter || provider.estado === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [providers, query, categoryFilter, statusFilter]);

  const handleDelete = async (id: string, nombre: string, productCount: number) => {
    const confirmation = window.confirm(
      `Eliminar proveedor ${nombre}${productCount > 0 ? `\nTiene ${productCount} producto(s) asociados y se eliminarán en cascada.` : ""}`
    );
    if (!confirmation) return;

    try {
      const res = await fetch("/api/proveedores/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage({ type: "error", text: data.error || "No se pudo eliminar el proveedor." });
        return;
      }
      setActionMessage({ type: "success", text: "Proveedor eliminado correctamente." });
      router.refresh();
      setSelectedProvider(null);
    } catch (error: any) {
      setActionMessage({ type: "error", text: error?.message ?? "Error al eliminar proveedor." });
    }
  };

  const normalizedProvider = selectedProvider
    ? {
        ...selectedProvider,
        contacto: selectedProvider.contacto ?? undefined,
        telefono: selectedProvider.telefono ?? undefined,
        whatsapp: selectedProvider.whatsapp ?? undefined,
        email: selectedProvider.email ?? undefined,
        ciudad: selectedProvider.ciudad ?? undefined,
        direccion: selectedProvider.direccion ?? undefined,
        notas: selectedProvider.notas ?? undefined,
        categoria: selectedProvider.categoria,
        estado: selectedProvider.estado
      }
    : undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
      <Card>
        <CardHeader className="flex items-center justify-between gap-4">
          <CardTitle>{selectedProvider ? "Editar proveedor" : "Nuevo proveedor"}</CardTitle>
          {selectedProvider ? (
            <Button variant="ghost" size="sm" onClick={() => setSelectedProvider(null)}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <ProveedorForm
            provider={normalizedProvider}
            onSaved={() => setSelectedProvider(null)}
            onCancel={() => setSelectedProvider(null)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Directorio veterinario</CardTitle>
              <p className="text-sm text-slate-500">Busca, filtra y administra tus proveedores.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar nombre, contacto, teléfono, ciudad..."
                  className="pl-10"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-10 rounded-md border bg-white px-3 text-sm text-slate-700"
              >
                <option value="">Todas las categorías</option>
                {categoriasProveedor.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria.toLowerCase().replace(/_/g, " ")}
                  </option>
                ))}
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
              {filteredProviders.length} proveedores
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {actionMessage ? (
            <div className={`mb-4 rounded-md px-4 py-3 text-sm ${actionMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {actionMessage.text}
            </div>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">
                    <div>{provider.nombre}</div>
                    {provider.direccion ? <div className="text-xs text-slate-500">{provider.direccion}</div> : null}
                  </TableCell>
                  <TableCell>{provider.contacto ?? "-"}</TableCell>
                  <TableCell>{provider.telefono ?? "-"}</TableCell>
                  <TableCell>{provider.whatsapp ?? "-"}</TableCell>
                  <TableCell>{provider.ciudad ?? "-"}</TableCell>
                  <TableCell>{provider.categoria.toLowerCase().replace(/_/g, " ")}</TableCell>
                  <TableCell>{provider._count.productos}</TableCell>
                  <TableCell>{provider.estado === "ACTIVO" ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" type="button" title="Editar" onClick={() => setSelectedProvider(provider)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="Eliminar"
                      onClick={() => handleDelete(provider.id, provider.nombre, provider._count.productos)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
