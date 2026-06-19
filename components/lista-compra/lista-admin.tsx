"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

export function ListaAdmin({ productos, lista }: { productos: any[]; lista: any[] }) {
  const router = useRouter();
  const [loadingSync, setLoadingSync] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = lista.filter((item) => item.producto.nombre.toLowerCase().includes(query.toLowerCase()));

  async function handleSync() {
    setLoadingSync(true);
    await fetch("/api/lista-compra/sync-low-stock", { method: "POST" });
    setLoadingSync(false);
    router.refresh();
  }

  async function changeEstado(id: string, estado: string) {
    await fetch("/api/lista-compra/status", { method: "PATCH", body: JSON.stringify({ id, estado }), headers: { "Content-Type": "application/json" } });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <input placeholder="Buscar producto..." className="flex-1 rounded-md border px-3 py-2" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button onClick={handleSync} disabled={loadingSync} className="bg-amber-500 hover:bg-amber-600">{loadingSync ? "Sincronizando..." : "Agregar bajo stock"}</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead /></TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.producto.nombre}</TableCell>
              <TableCell>{item.producto.proveedor?.nombre ?? "-"}</TableCell>
              <TableCell>{item.cantidadRequerida} {item.producto.unidad}</TableCell>
              <TableCell>
                <select value={item.estado} onChange={(e) => changeEstado(item.id, e.target.value)} className="rounded-md border px-2 py-1">
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="COTIZADO">Cotizado</option>
                  <option value="COMPRADO">Comprado</option>
                  <option value="RECIBIDO">Recibido</option>
                </select>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={async () => { await fetch('/api/lista-compra/delete', { method: 'POST', body: JSON.stringify({ id: item.id }), headers: {'Content-Type':'application/json'} }); router.refresh(); }}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
