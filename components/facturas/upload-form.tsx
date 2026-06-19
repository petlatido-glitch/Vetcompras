"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ManualProducto {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  totalLinea: number;
}

interface FacturaPreview {
  id: string;
  fileName: string;
  proveedor: string;
  fecha: string;
  estado: string;
  numeroFactura?: string;
  observaciones?: string;
  productos?: ManualProducto[];
  subtotal?: number;
  iva?: number;
  totalFactura?: number;
}

export function UploadFacturaForm() {
  const [file, setFile] = useState<File | null>(null);
  const [proveedor, setProveedor] = useState<string>("");
  const [facturas, setFacturas] = useState<FacturaPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualProveedor, setManualProveedor] = useState<string>("");
  const [manualFecha, setManualFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [manualNumeroFactura, setManualNumeroFactura] = useState<string>("");
  const [manualObservaciones, setManualObservaciones] = useState<string>("");
  const [manualProducto, setManualProducto] = useState<string>("");
  const [manualCantidad, setManualCantidad] = useState<number>(1);
  const [manualPrecioUnitario, setManualPrecioUnitario] = useState<number>(0);
  const [manualIva, setManualIva] = useState<number>(0);
  const [manualProductos, setManualProductos] = useState<ManualProducto[]>([]);
  const [manualError, setManualError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Selecciona una factura (PDF o imagen) antes de subir la factura.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("proveedor", proveedor || "Proveedor pendiente");

      const response = await fetch("/api/facturas/process", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.error || "Error al procesar la factura.";
        throw new Error(message);
      }

      const nuevaFactura: FacturaPreview = {
        id: `${Date.now()}`,
        fileName: file.name,
        proveedor: proveedor || "Proveedor pendiente",
        fecha: new Date().toLocaleDateString("es-ES"),
        estado: "Pendiente"
      };

      setFacturas((prev) => [nuevaFactura, ...prev]);
      setProveedor("");
      setFile(null);
      const input = document.getElementById("factura-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (err: any) {
      setError(err?.message || "Error al subir la factura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addManualProducto = () => {
    setManualError(null);

    if (!manualProducto.trim()) {
      setManualError("Ingresa el nombre del producto.");
      return;
    }
    if (manualCantidad <= 0) {
      setManualError("La cantidad debe ser mayor que cero.");
      return;
    }
    if (manualPrecioUnitario <= 0) {
      setManualError("El precio unitario debe ser mayor que cero.");
      return;
    }

    const totalLinea = parseFloat((manualCantidad * manualPrecioUnitario).toFixed(2));

    setManualProductos((prev) => [
      ...prev,
      {
        nombre: manualProducto.trim(),
        cantidad: manualCantidad,
        precioUnitario: manualPrecioUnitario,
        totalLinea
      }
    ]);

    setManualProducto("");
    setManualCantidad(1);
    setManualPrecioUnitario(0);
  };

  const subtotal = manualProductos.reduce((total, producto) => total + producto.totalLinea, 0);
  const ivaMonto = parseFloat(((subtotal * manualIva) / 100).toFixed(2));
  const totalFactura = parseFloat((subtotal + ivaMonto).toFixed(2));

  const handleCreateManualFactura = () => {
    setManualError(null);

    if (!manualProveedor.trim()) {
      setManualError("Ingresa el proveedor de la factura.");
      return;
    }
    if (manualProductos.length === 0) {
      setManualError("Agrega al menos un producto.");
      return;
    }

    const nuevaFactura: FacturaPreview = {
      id: `${Date.now()}`,
      fileName: manualNumeroFactura ? `Factura ${manualNumeroFactura}` : `Factura manual - ${manualProveedor}`,
      proveedor: manualProveedor.trim(),
      fecha: manualFecha,
      estado: "Pendiente",
      numeroFactura: manualNumeroFactura.trim() || undefined,
      observaciones: manualObservaciones.trim() || undefined,
      productos: manualProductos,
      subtotal,
      iva: manualIva,
      totalFactura
    };

    setFacturas((prev) => [nuevaFactura, ...prev]);
    setIsManualModalOpen(false);
    setManualProveedor("");
    setManualFecha(new Date().toISOString().slice(0, 10));
    setManualNumeroFactura("");
    setManualObservaciones("");
    setManualProducto("");
    setManualCantidad(1);
    setManualPrecioUnitario(0);
    setManualIva(0);
    setManualProductos([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">Agregar factura</h2>
          <p className="text-sm text-slate-600">Sube una factura o crea una factura manual.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" className="bg-slate-200 text-slate-900 hover:bg-slate-300" onClick={() => setIsManualModalOpen(true)}>
            Crear factura manual
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <Label>Proveedor</Label>
          <Input
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            placeholder="Proveedor de la factura"
          />
        </div>

        <div>
          <Label>Selecciona una factura (PDF o imagen)</Label>
          <input
            id="factura-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFile}
            className="mt-2"
          />
          <p className="mt-2 text-sm text-slate-500">Formatos permitidos: PDF, JPG, JPEG, PNG y WEBP</p>
          {file && (
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div><strong>Nombre:</strong> {file.name}</div>
              <div><strong>Tamaño:</strong> {formatFileSize(file.size)}</div>
              <div><strong>Tipo:</strong> {file.type || "Desconocido"}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="bg-amber-500 hover:bg-amber-600">
            Subir factura
          </Button>
        </div>
      </form>

      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Crear factura manual</h2>
                <p className="text-sm text-slate-600">Completa los datos de la factura y agrega los productos.</p>
              </div>
              <button type="button" className="text-slate-500 hover:text-slate-900" onClick={() => setIsManualModalOpen(false)}>
                Cerrar
              </button>
            </div>

            {manualError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {manualError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Proveedor</Label>
                <Input
                  value={manualProveedor}
                  onChange={(e) => setManualProveedor(e.target.value)}
                  placeholder="Proveedor de la factura"
                />
              </div>
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={manualFecha}
                  onChange={(e) => setManualFecha(e.target.value)}
                />
              </div>
              <div>
                <Label>Número de factura (opcional)</Label>
                <Input
                  value={manualNumeroFactura}
                  onChange={(e) => setManualNumeroFactura(e.target.value)}
                  placeholder="Número de factura"
                />
              </div>
              <div>
                <Label>IVA (%)</Label>
                <Input
                  type="number"
                  value={manualIva}
                  min={0}
                  max={100}
                  step="0.01"
                  onChange={(e) => setManualIva(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>Observaciones</Label>
              <textarea
                value={manualObservaciones}
                onChange={(e) => setManualObservaciones(e.target.value)}
                className="mt-2 min-h-[100px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="Observaciones de la factura"
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <Label>Producto</Label>
                <Input
                  value={manualProducto}
                  onChange={(e) => setManualProducto(e.target.value)}
                  placeholder="Nombre del producto"
                />
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={manualCantidad}
                  min={1}
                  onChange={(e) => setManualCantidad(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Precio unitario</Label>
                <Input
                  type="number"
                  value={manualPrecioUnitario}
                  min={0}
                  step="0.01"
                  onChange={(e) => setManualPrecioUnitario(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button type="button" className="bg-amber-500 hover:bg-amber-600" onClick={addManualProducto}>
                + Agregar producto
              </Button>
              <span className="text-sm text-slate-500">Agrega múltiples productos a la misma factura.</span>
            </div>

            {manualProductos.length > 0 && (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FFFBF7]">
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio unitario</TableHead>
                      <TableHead>Total línea</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualProductos.map((producto, index) => (
                      <TableRow key={index} className="border-b border-[#F2E3D7]">
                        <TableCell>{producto.nombre}</TableCell>
                        <TableCell>{producto.cantidad}</TableCell>
                        <TableCell>${producto.precioUnitario.toFixed(2)}</TableCell>
                        <TableCell>${producto.totalLinea.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Subtotal</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">${subtotal.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">IVA ({manualIva.toFixed(2)}%)</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">${ivaMonto.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total factura</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">${totalFactura.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" className="bg-slate-200 text-slate-900 hover:bg-slate-300" onClick={() => setIsManualModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" className="bg-amber-500 hover:bg-amber-600" onClick={handleCreateManualFactura}>
                Guardar factura manual
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[#E9D7C2] bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Facturas cargadas</h2>
            <p className="text-sm text-slate-600">Las facturas se registran aquí para su revisión y procesamiento posterior.</p>
          </div>
        </div>

        {facturas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No hay facturas cargadas todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FFFBF7]">
                  <TableHead>Factura</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((factura) => (
                  <TableRow key={factura.id} className="border-b border-[#F2E3D7]">
                    <TableCell>{factura.fileName}</TableCell>
                    <TableCell>{factura.proveedor}</TableCell>
                    <TableCell>{factura.fecha}</TableCell>
                    <TableCell>${factura.totalFactura?.toFixed(2) ?? "-"}</TableCell>
                    <TableCell>{factura.estado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
