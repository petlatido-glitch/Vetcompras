"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertListaCompraItem } from "@/lib/actions/catalogos";
import { listaCompraSchema, type ListaCompraInput } from "@/lib/validators/catalogos";

export function ListaCompraForm({ productos }: { productos: Array<{ id: string; nombre: string }> }) {
  const router = useRouter();
  const [isManual, setIsManual] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<ListaCompraInput>({
    resolver: zodResolver(listaCompraSchema) as Resolver<ListaCompraInput>,
    defaultValues: { productoId: productos[0]?.id ?? "", cantidadRequerida: 1 }
  });

  async function onSubmit(values: ListaCompraInput) {
    setIsSaving(true);
    await fetch("/api/lista-compra/upsert", { method: "POST", body: JSON.stringify(values), headers: { "Content-Type": "application/json" } });
    setIsSaving(false);
    form.reset({ productoId: productos[0]?.id ?? "", cantidadRequerida: 1 });
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2">
        <input id="manual" type="checkbox" checked={isManual} onChange={(e) => setIsManual(e.target.checked)} />
        <Label htmlFor="manual">Producto manual</Label>
      </div>
      <div className="space-y-2">
        <Label>Producto</Label>
        {!isManual ? (
          <select {...form.register("productoId")} name="productoId" className="h-10 w-full rounded-md border bg-white px-3 text-sm">
            {productos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
          </select>
        ) : (
          <Input {...form.register("nombreManual")} name="nombreManual" placeholder="Nombre del producto" />
        )}
      </div>
      <div className="space-y-2"><Label>Cantidad requerida</Label><Input {...form.register("cantidadRequerida")} name="cantidadRequerida" type="number" min="1" /></div>
      <Button className="w-full bg-orange-500 hover:bg-orange-600" disabled={isSaving}>{isSaving ? "Guardando..." : "Agregar a lista"}</Button>
    </form>
  );
}
