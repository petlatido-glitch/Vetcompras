"use client";

import React, { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, type SubmitHandler, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
  categorias,
  estadosProducto,
  productoSchema,
  unidades,
  type ProductoInput
} from "@/lib/validators/catalogos";

interface ProveedorOption {
  id: string;
  nombre: string;
  categoria?: string | null;
  estado?: string | null;
}

type ProductoFormValues = Omit<ProductoInput, "marca" | "laboratorio" | "presentacion" | "lote" | "observaciones"> & {
  precioCompra?: string | number;
  precioSugerido?: string | number;
  ultimoCosto?: string | number;
  proveedorId?: string | undefined;
  marca?: string | undefined;
  laboratorio?: string | undefined;
  presentacion?: string | undefined;
  lote?: string | undefined;
  observaciones?: string | undefined;
  categoria?: (typeof categorias)[number];
  unidad?: (typeof unidades)[number];
  estado?: (typeof estadosProducto)[number];
};

interface ProductoFormProps {
  product?: ProductoFormValues;
  providers: ProveedorOption[];
  onSuccess?: () => void;
}

export function ProductoForm({ product, providers, onSuccess }: ProductoFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema) as Resolver<ProductoFormValues>,
    defaultValues: {
      id: undefined,
      nombre: "",
      categoria: "MEDICAMENTOS",
      marca: "",
      laboratorio: "",
      proveedorId: undefined,
      sku: "",
      unidad: "unidad",
      stockActual: 0,
      stockMinimo: 1,
      precioCompra: undefined,
      precioSugerido: undefined,
      ultimoCosto: undefined,
      presentacion: "",
      lote: "",
      fechaVencimiento: undefined,
      observaciones: "",
      estado: "ACTIVO"
    }
  });

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = form;

  useEffect(() => {
    reset(
      product
        ? {
            ...product,
            categoria: product.categoria,
            proveedorId: product.proveedorId ?? undefined,
            precioCompra: product.precioCompra ?? undefined,
            precioSugerido: product.precioSugerido ?? undefined,
            ultimoCosto: product.ultimoCosto ?? undefined,
            estado: product.estado ?? "ACTIVO"
          }
        : {
            id: undefined,
            nombre: "",
            categoria: "MEDICAMENTOS",
            marca: "",
            laboratorio: "",
            proveedorId: undefined,
            sku: "",
            unidad: "unidad",
            stockActual: 0,
            stockMinimo: 1,
            precioCompra: undefined,
            precioSugerido: undefined,
            ultimoCosto: undefined,
            presentacion: "",
            lote: "",
            fechaVencimiento: undefined,
            observaciones: "",
            estado: "ACTIVO"
          }
    );
  }, [product, reset]);

  const isEditing = Boolean(product?.id);

  const getInputClass = (hasError?: boolean) =>
    `w-full rounded-md border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 ${
      hasError
        ? 'border-red-500 bg-red-50 focus-visible:ring-red-500'
        : 'border-input bg-background focus-visible:ring-ring'
    }`;

  const onSubmit: SubmitHandler<ProductoFormValues> = async (values) => {
    setMessage(null);

    const payload = { ...values };
    const hasForm = formRef.current instanceof HTMLFormElement;
    const body = hasForm ? new FormData(formRef.current as HTMLFormElement) : null;

    try {
      const res = await fetch('/api/productos/upsert', {
        method: 'POST',
        body: body ?? JSON.stringify(payload),
        headers: body ? undefined : { 'content-type': 'application/json' }
      });

      const responseBody = await res.json();
      if (!res.ok || !responseBody.success) {
        setMessage({ type: 'error', text: responseBody.error || 'Error al guardar producto' });
        return;
      }

      setMessage({ type: 'success', text: 'Producto guardado correctamente.' });
      reset();
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message ?? 'Error de red' });
    }
  }

  function onError() {
    setMessage({ type: 'error', text: 'Corrige los campos marcados en rojo.' });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
      <input type="hidden" {...register("id")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre del producto</Label>
          <Input {...register("nombre")} name="nombre" required className={getInputClass(Boolean(errors.nombre))} />
          {errors.nombre ? <p className="text-sm text-red-600">{errors.nombre.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Categoría</Label>
          <select {...register("categoria")} name="categoria" className={getInputClass(Boolean(errors.categoria))} required>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {errors.categoria ? <p className="text-sm text-red-600">{errors.categoria.message?.toString() ?? 'Selecciona una categoría'}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Marca</Label>
          <Input {...register("marca")} name="marca" className={getInputClass(Boolean(errors.marca))} />
          {errors.marca ? <p className="text-sm text-red-600">{errors.marca.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Laboratorio</Label>
          <Input {...register("laboratorio")} name="laboratorio" className={getInputClass(Boolean(errors.laboratorio))} />
          {errors.laboratorio ? <p className="text-sm text-red-600">{errors.laboratorio.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Proveedor principal</Label>
          <select {...register("proveedorId")} name="proveedorId" className={getInputClass(Boolean(errors.proveedorId))}>
            <option value="">Seleccionar proveedor</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.nombre}
                {provider.categoria ? ` · ${provider.categoria.toLowerCase().replace(/_/g, " ")}` : ""}
                {provider.estado === "INACTIVO" ? " · Inactivo" : ""}
              </option>
            ))}
          </select>
          {errors.proveedorId ? <p className="text-sm text-red-600">{errors.proveedorId.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Código interno / SKU</Label>
          <Input {...register("sku")} name="sku" className={getInputClass(Boolean(errors.sku))} />
          {errors.sku ? <p className="text-sm text-red-600">{errors.sku.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Unidad base</Label>
          <select {...register("unidad")} name="unidad" className={getInputClass(Boolean(errors.unidad))} required>
            {unidades.map((unidad) => (
              <option key={unidad} value={unidad}>
                {unidad}
              </option>
            ))}
          </select>
          {errors.unidad ? <p className="text-sm text-red-600">{errors.unidad.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Presentación</Label>
          <Input {...register("presentacion")} name="presentacion" placeholder="Frasco 100ml, Caja x10" className={getInputClass(Boolean(errors.presentacion))} />
          {errors.presentacion ? <p className="text-sm text-red-600">{errors.presentacion.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Precio compra</Label>
          <Input {...register("precioCompra")} name="precioCompra" type="number" min="0" step="0.01" className={getInputClass(Boolean(errors.precioCompra))} />
          {errors.precioCompra ? <p className="text-sm text-red-600">{errors.precioCompra.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Precio sugerido</Label>
          <Input {...register("precioSugerido")} name="precioSugerido" type="number" min="0" step="0.01" className={getInputClass(Boolean(errors.precioSugerido))} />
          {errors.precioSugerido ? <p className="text-sm text-red-600">{errors.precioSugerido.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Stock actual</Label>
          <Input {...register("stockActual")} name="stockActual" type="number" min="0" required className={getInputClass(Boolean(errors.stockActual))} />
          {errors.stockActual ? <p className="text-sm text-red-600">{errors.stockActual.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Stock mínimo</Label>
          <Input {...register("stockMinimo")} name="stockMinimo" type="number" min="0" required className={getInputClass(Boolean(errors.stockMinimo))} />
          {errors.stockMinimo ? <p className="text-sm text-red-600">{errors.stockMinimo.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Último costo</Label>
          <Input {...register("ultimoCosto")} name="ultimoCosto" type="number" min="0" step="0.01" className={getInputClass(Boolean(errors.ultimoCosto))} />
          {errors.ultimoCosto ? <p className="text-sm text-red-600">{errors.ultimoCosto.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Fecha de vencimiento</Label>
          <Input {...register("fechaVencimiento")} name="fechaVencimiento" type="date" className={getInputClass(Boolean(errors.fechaVencimiento))} />
          {errors.fechaVencimiento ? <p className="text-sm text-red-600">{errors.fechaVencimiento.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Lote</Label>
          <Input {...register("lote")} name="lote" className={getInputClass(Boolean(errors.lote))} />
          {errors.lote ? <p className="text-sm text-red-600">{errors.lote.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <select {...register("estado")} name="estado" className={getInputClass(Boolean(errors.estado))} required>
            {estadosProducto.map((estado) => (
              <option key={estado} value={estado}>
                {estado === "ACTIVO" ? "Activo" : "Inactivo"}
              </option>
            ))}
          </select>
          {errors.estado ? <p className="text-sm text-red-600">{errors.estado.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observaciones</Label>
        <textarea
          {...register("observaciones")}
          name="observaciones"
          rows={4}
          className={getInputClass(Boolean(errors.observaciones))}
          placeholder="Notas clínicas, uso preferente, instrucciones de almacenamiento"
        />
        {errors.observaciones ? <p className="text-sm text-red-600">{errors.observaciones.message?.toString()}</p> : null}
      </div>

      <div>
        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
          {isEditing ? 'Actualizar producto' : 'Guardar producto'}
        </Button>
        {message ? (
          <div className={`mt-3 rounded-md px-3 py-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        ) : null}
      </div>
    </form>
  );
}
