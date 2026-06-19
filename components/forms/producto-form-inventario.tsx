"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { categorias, estadosProducto, productoSchema, unidades, type ProductoInput } from "@/lib/validators/catalogos";

interface ProductoFormInventarioProps {
  product?: Pick<ProductoInput, "id" | "nombre" | "categoria" | "marca" | "laboratorio" | "unidad" | "presentacion" | "fechaVencimiento" | "observaciones" | "estado">;
  onSuccess?: () => void;
}

type ProductoFormInventarioValues = ProductoFormInventarioProps["product"] & {
  stockActual: number;
  stockMinimo: number;
};

export function ProductoFormSimple({ product, onSuccess }: ProductoFormInventarioProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const form = useForm<ProductoFormInventarioValues>({
    resolver: zodResolver(productoSchema) as any,
    defaultValues: {
      id: undefined,
      nombre: "",
      categoria: "MEDICAMENTOS",
      marca: "",
      laboratorio: "",
      unidad: "unidad",
      presentacion: "",
      fechaVencimiento: undefined,
      observaciones: "",
      estado: "ACTIVO",
      stockActual: 0,
      stockMinimo: 0
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
            marca: product.marca ?? "",
            laboratorio: product.laboratorio ?? "",
            unidad: product.unidad,
            presentacion: product.presentacion ?? "",
            fechaVencimiento: product.fechaVencimiento as any,
            observaciones: product.observaciones ?? "",
            estado: product.estado ?? "ACTIVO",
            stockActual: 0,
            stockMinimo: 0
          }
        : {
            id: undefined,
            nombre: "",
            categoria: "MEDICAMENTOS",
            marca: "",
            laboratorio: "",
            unidad: "unidad",
            presentacion: "",
            fechaVencimiento: undefined,
            observaciones: "",
            estado: "ACTIVO",
            stockActual: 0,
            stockMinimo: 0
          }
    );
  }, [product, reset]);

  const getInputClass = (hasError?: boolean) =>
    `w-full rounded-md border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 ${
      hasError
        ? "border-red-500 bg-red-50 focus-visible:ring-red-500"
        : "border-input bg-background focus-visible:ring-ring"
    }`;

  const onSubmit: SubmitHandler<ProductoFormInventarioValues> = async (values) => {
    setMessage(null);

    const payload = {
      ...values,
      stockActual: values.stockActual ?? 0,
      stockMinimo: values.stockMinimo ?? 0
    };

    try {
      const res = await fetch("/api/productos/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responseBody = await res.json();
      if (!res.ok || !responseBody.success) {
        setMessage({ type: "error", text: responseBody.error || "Error al guardar producto" });
        return;
      }

      setMessage({ type: "success", text: "Producto guardado correctamente." });
      reset();
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ?? "Error de red" });
    }
  };

  function onError() {
    setMessage({ type: "error", text: "Corrige los campos marcados en rojo." });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
      <input type="hidden" {...register("id")} />
      <input type="hidden" value={0} {...register("stockActual", { valueAsNumber: true })} />
      <input type="hidden" value={0} {...register("stockMinimo", { valueAsNumber: true })} />

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
          {errors.categoria ? <p className="text-sm text-red-600">{errors.categoria.message?.toString() ?? "Selecciona una categoría"}</p> : null}
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
          <Input {...register("presentacion")} name="presentacion" placeholder="Tableta, vial, ml, bolsa, caja" className={getInputClass(Boolean(errors.presentacion))} />
          {errors.presentacion ? <p className="text-sm text-red-600">{errors.presentacion.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Fecha de vencimiento</Label>
          <Input {...register("fechaVencimiento")} name="fechaVencimiento" type="date" className={getInputClass(Boolean(errors.fechaVencimiento))} />
          {errors.fechaVencimiento ? <p className="text-sm text-red-600">{errors.fechaVencimiento.message?.toString()}</p> : null}
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
          Guardar producto
        </Button>
        {message ? (
          <div className={`mt-3 rounded-md px-3 py-2 text-sm ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {message.text}
          </div>
        ) : null}
      </div>
    </form>
  );
}
