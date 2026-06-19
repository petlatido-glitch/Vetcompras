"use client";

import React, { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, type SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  proveedorSchema,
  categoriasProveedor,
  estadosProveedor,
  type ProveedorInput
} from "@/lib/validators/catalogos";

interface ProveedorFormProps {
  provider?: ProveedorInput;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function ProveedorForm({ provider, onSaved, onCancel }: ProveedorFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProveedorInput>({
    resolver: zodResolver(proveedorSchema) as Resolver<ProveedorInput>,
    defaultValues: {
      id: undefined,
      nombre: "",
      contacto: "",
      telefono: "",
      whatsapp: "",
      email: "",
      ciudad: "",
      direccion: "",
      categoria: "VARIOS",
      estado: "ACTIVO",
      notas: ""
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
      provider
        ? {
            ...provider,
            categoria: provider.categoria ?? "VARIOS",
            estado: provider.estado ?? "ACTIVO"
          }
        : {
            id: undefined,
            nombre: "",
            contacto: "",
            telefono: "",
            whatsapp: "",
            email: "",
            ciudad: "",
            direccion: "",
            categoria: "VARIOS",
            estado: "ACTIVO",
            notas: ""
          }
    );
    setMessage(null);
  }, [provider, reset]);

  const getInputClass = (hasError?: boolean) =>
    `w-full rounded-md border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 ${
      hasError
        ? "border-red-500 bg-red-50 focus-visible:ring-red-500"
        : "border-input bg-background focus-visible:ring-ring"
    }`;

  const onSubmit: SubmitHandler<ProveedorInput> = async (values) => {
    setMessage(null);
    setIsSaving(true);

    try {
      const body = new FormData(formRef.current as HTMLFormElement);
      const response = await fetch("/api/proveedores/upsert", {
        method: "POST",
        body
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage({ type: "error", text: result.error || "Error al guardar proveedor" });
        setIsSaving(false);
        return;
      }

      setMessage({ type: "success", text: provider ? "Proveedor actualizado correctamente." : "Proveedor creado correctamente." });
      reset();
      setIsSaving(false);
      onSaved?.();
      router.refresh();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "Error de red" });
      setIsSaving(false);
    }
  };

  const onError = (errs: any) => {
    const firstKey = Object.keys(errs || {})[0];
    const firstMsg = firstKey ? errs[firstKey]?.message?.toString() ?? "Corrige los campos marcados en rojo." : "Corrige los campos marcados en rojo.";
    setMessage({ type: "error", text: firstMsg });
    try {
      form.setFocus(firstKey as any);
    } catch (e) {
      // ignore
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
      {provider?.id ? <input type="hidden" {...register("id")} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre comercial</Label>
          <Input {...register("nombre")} name="nombre" className={getInputClass(Boolean(errors.nombre))} required />
          {errors.nombre ? <p className="text-sm text-red-600">{errors.nombre.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Nombre de contacto</Label>
          <Input {...register("contacto")} name="contacto" className={getInputClass(Boolean(errors.contacto))} />
          {errors.contacto ? <p className="text-sm text-red-600">{errors.contacto.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input {...register("telefono")} name="telefono" className={getInputClass(Boolean(errors.telefono))} />
          {errors.telefono ? <p className="text-sm text-red-600">{errors.telefono.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>WhatsApp</Label>
          <Input {...register("whatsapp")} name="whatsapp" className={getInputClass(Boolean(errors.whatsapp))} />
          {errors.whatsapp ? <p className="text-sm text-red-600">{errors.whatsapp.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Correo</Label>
          <Input {...register("email")} name="email" type="email" className={getInputClass(Boolean(errors.email))} />
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Ciudad</Label>
          <Input {...register("ciudad")} name="ciudad" className={getInputClass(Boolean(errors.ciudad))} />
          {errors.ciudad ? <p className="text-sm text-red-600">{errors.ciudad.message?.toString()}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Dirección</Label>
        <Input {...register("direccion")} name="direccion" className={getInputClass(Boolean(errors.direccion))} />
        {errors.direccion ? <p className="text-sm text-red-600">{errors.direccion.message?.toString()}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Categoría</Label>
          <select {...register("categoria")} name="categoria" className={getInputClass(Boolean(errors.categoria))} required>
            {categoriasProveedor.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria.toLowerCase().replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {errors.categoria ? <p className="text-sm text-red-600">{errors.categoria.message?.toString()}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <select {...register("estado")} name="estado" className={getInputClass(Boolean(errors.estado))} required>
            {estadosProveedor.map((estado) => (
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
        <Textarea {...register("notas")} name="notas" className={getInputClass(Boolean(errors.notas))} rows={4} />
        {errors.notas ? <p className="text-sm text-red-600">{errors.notas.message?.toString()}</p> : null}
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isSaving}>
          {isSaving ? "Guardando..." : provider ? "Actualizar proveedor" : "Guardar proveedor"}
        </Button>
        {provider ? (
          <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
            Cancelar edición
          </Button>
        ) : null}
        {message ? (
          <div className={`rounded-md px-3 py-2 text-sm ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {message.text}
          </div>
        ) : null}
      </div>
    </form>
  );
}
