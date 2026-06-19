"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Barcode, Layers, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { findProductMatch, parseDetectedItems, parseDetectedItemsWithDebug, ParsedCotizacionItem, ParserDebugResult, normalizeProductName, compareProviderPrices } from "@/lib/cotizacion-parser";
import { CotizacionDetailModal } from "@/components/cotizaciones/cotizacion-detail-modal";

type Provider = { id: string; nombre: string };

type Product = { id: string; nombre: string };

type CotizacionItem = {
  id: string;
  nombreDetectado: string;
  precio: string;
  presentacion?: string | null;
  producto: { id: string; nombre: string };
};

type CotizacionRecord = {
  id: string;
  proveedor: { id: string; nombre: string };
  fecha: string;
  archivoUrl: string;
  archivoNombre: string;
  archivoTipo: string;
  estadoOcr: string;
  items: CotizacionItem[];
};

type DetectedItemDraft = ParsedCotizacionItem & {
  productoId?: string;
  matchedProductName?: string;
};

type ParserTrace = {
  ocrReceived: number;
  preprocesamientoStarted: boolean;
  linesDetected: number;
  candidateLines: number;
  parserCalled: boolean;
  parserRun: boolean;
  parserItems: number;
  parserError?: string;
};

type Props = {
  providers: Provider[];
  products: Product[];
  cotizaciones: CotizacionRecord[];
};

const STORAGE_BUCKET = "cotizaciones";

export function CotizacionesAdmin({ providers, products, cotizaciones }: Props) {
  const router = useRouter();
  const [selectedProviderId, setSelectedProviderId] = useState(providers[0]?.id ?? "");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [detectedItems, setDetectedItems] = useState<DetectedItemDraft[]>([]);
  const [parserDebug, setParserDebug] = useState<ParserDebugResult | null>(null);
  const [parserTrace, setParserTrace] = useState<ParserTrace>({
    ocrReceived: 0,
    preprocesamientoStarted: false,
    linesDetected: 0,
    candidateLines: 0,
    parserCalled: false,
    parserRun: false,
    parserItems: 0,
    parserError: undefined
  });
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedCotizacion, setSelectedCotizacion] = useState<CotizacionRecord | null>(null);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const selectedProviderName = providers.find((provider) => provider.id === selectedProviderId)?.nombre || "";
  const fileSupportText = ".pdf, .docx, .png, .jpg, .jpeg o texto manual";

  const filteredCotizaciones = useMemo(() => {
    const normalized = search.toLowerCase().trim();
    return cotizaciones.filter((cotizacion) => {
      const matchesSearch =
        !normalized ||
        cotizacion.proveedor.nombre.toLowerCase().includes(normalized) ||
        cotizacion.archivoNombre.toLowerCase().includes(normalized) ||
        cotizacion.items.some((item) => item.nombreDetectado.toLowerCase().includes(normalized));

      const matchesProvider = !providerFilter || cotizacion.proveedor.id === providerFilter;
      const matchesStatus = !statusFilter || cotizacion.estadoOcr === statusFilter;
      return matchesSearch && matchesProvider && matchesStatus;
    });
  }, [cotizaciones, search, providerFilter, statusFilter]);

  const comparisons = useMemo(() => compareProviderPrices(cotizaciones), [cotizaciones]);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setDetectedItems([]);
    setMessage(null);
  }

  function safeNumber(value: string | number) {
    const numberValue = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(/,/g, "."));
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  async function extractTextFromFile(uploadedFile: File) {
    const extension = uploadedFile.name.split(".").pop()?.toLowerCase();
    if (!extension) return "";

    if (extension === "pdf") {
      const pdfjsLib = await import("pdfjs-dist/webpack");
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageTexts = await Promise.all(
        Array.from({ length: doc.numPages }, (_, index) => doc.getPage(index + 1).then((page: any) => page.getTextContent()).then((content: any) => content.items.map((item: any) => item.str).join(" ")))
      );
      return pageTexts.join("\n");
    }

    if (["png", "jpg", "jpeg"].includes(extension)) {
      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker({ logger: () => undefined });
      await worker.load();
      await worker.loadLanguage("spa");
      await worker.initialize("spa");
      const { data } = await worker.recognize(uploadedFile);
      await worker.terminate();
      return data.text || "";
    }

    if (extension === "docx") {
      const mammoth = await import("mammoth");
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || "";
    }

    if (extension === "doc") {
      return "El formato .doc no se puede procesar automáticamente en el navegador. Por favor revisa el texto manualmente o usa .pdf/.docx/.png/.jpg.";
    }

    return await uploadedFile.text();
  }

  async function handleParseFile() {
    if (!file) {
      setMessage({ type: "error", text: "Selecciona primero un archivo válido." });
      return;
    }

    setProcessing(true);
    setMessage(null);
    try {
      const text = await extractTextFromFile(file);
      console.log("=== RAW OCR TEXT ===");
      console.log(text);
      console.log("=== END RAW OCR ===");
      
      setOcrText(text);
      setParserTrace({
        ocrReceived: text.length,
        preprocesamientoStarted: false,
        linesDetected: 0,
        candidateLines: 0,
        parserCalled: false,
        parserRun: false,
        parserItems: 0,
        parserError: undefined
      });

      const debugResult = parseDetectedItemsWithDebug(text);
      setParserDebug(debugResult);
      setParserTrace((prev) => ({
        ...prev,
        preprocesamientoStarted: true,
        linesDetected: debugResult.originalLines.length,
        candidateLines: debugResult.mergedLines.length
      }));

      const extracted = parseDetectedItems(text);
      setParserTrace((prev) => ({
        ...prev,
        parserCalled: true,
        parserRun: true,
        parserItems: extracted.length
      }));

      console.log(`parseDetectedItems called from Extraer productos button`);
      console.log(`Extracted ${extracted.length} items from OCR`);
      console.log(debugResult);
      
      const items = extracted.map((item) => {
        const match = findProductMatch(item.nombreDetectado, products);
        return {
          ...item,
          productoId: match?.id,
          matchedProductName: match?.matchedProductName
        };
      });
      setDetectedItems(items);
      if (!items.length) {
        setParserTrace((prev) => ({ ...prev, parserError: "parser ejecutado pero devolvió array vacío" }));
        setMessage({ type: "error", text: "No se detectaron productos válidos. Revisa el texto OCR en los detalles abajo." });
      } else {
        setMessage({ type: "success", text: `${items.length} producto(s) detectado(s). Revisa y guarda.` });
      }
    } catch (error: any) {
      setParserTrace((prev) => ({ ...prev, parserError: error?.message ?? "error silencioso" }));
      setMessage({ type: "error", text: error?.message ?? "Error al extraer el archivo." });
    } finally {
      setProcessing(false);
    }
  }

  function handleParseManual() {
    const debugResult = parseDetectedItemsWithDebug(manualText);
    setParserDebug(debugResult);
    setParserTrace({
      ocrReceived: manualText.length,
      preprocesamientoStarted: true,
      linesDetected: debugResult.originalLines.length,
      candidateLines: debugResult.mergedLines.length,
      parserCalled: true,
      parserRun: true,
      parserItems: debugResult.items.length,
      parserError: undefined
    });
    const items = debugResult.items.map((item) => {
      const match = findProductMatch(item.nombreDetectado, products);
      return {
        ...item,
        productoId: match?.id,
        matchedProductName: match?.matchedProductName
      };
    });
    setDetectedItems(items);
    if (!items.length) {
      setParserTrace((prev) => ({ ...prev, parserError: "parser ejecutado pero devolvió array vacío" }));
      setMessage({ type: "error", text: "No se encontraron líneas válidas en el texto." });
    } else {
      setMessage({ type: "success", text: `${items.length} producto(s) detectado(s) manualmente.` });
    }
  }

  async function uploadFile() {
    if (!file) return file?.name ?? "manual";
    try {
      const supabase = createSupabaseBrowserClient();
      const path = `cotizaciones/${selectedProviderId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true });
      if (error) {
        return file.name;
      }
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return data.publicUrl ?? file.name;
    } catch {
      return file.name;
    }
  }

  function updateDetectedItem(index: number, field: keyof ParsedCotizacionItem | "productoId" | "revisado") {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const rawValue = field === "revisado" ? String((event.target as HTMLInputElement).checked) : event.target.value;
      const parsedValue = field === "precio" || field === "precioUnitario" || field === "precioTotal" || field === "cantidad"
        ? safeNumber(rawValue)
        : field === "revisado"
        ? (rawValue === "true")
        : rawValue;

      setDetectedItems((current) =>
        current.map((item, idx) => (idx === index ? { ...item, [field]: parsedValue } : item))
      );
    };
  }

  function setItemPrecio(index: number, value: string) {
    setDetectedItems((current) =>
      current.map((item, idx) => (idx === index ? { ...item, precio: safeNumber(value) } : item))
    );
  }

  function addManualProduct() {
    setDetectedItems((current) => [
      ...current,
      {
        nombreOCR: "",
        nombreDetectado: "",
        precio: 0,
        presentacion: "",
        laboratorio: "",
        cantidadUnidad: undefined,
        cantidad: null,
        precioCompra: 0,
        precioUnitario: 0,
        precioTotal: 0,
        proveedorCodigo: undefined,
        proveedor: undefined,
        fecha: undefined,
        confianza: 0,
        estado: "revisar manualmente",
        needsReview: true,
        revisado: false
      }
    ]);
  }

  async function handleSaveCotizacion() {
    if (!selectedProviderId) {
      setMessage({ type: "error", text: "Selecciona un proveedor antes de guardar." });
      return;
    }
    if (!detectedItems.length) {
      setMessage({ type: "error", text: "No hay productos detectados para guardar." });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      const archivoUrl = await uploadFile();
      const body = {
        proveedorId: selectedProviderId,
        fecha,
        archivoUrl,
        archivoNombre: file?.name ?? `manual-${Date.now()}`,
        archivoTipo: file ? file.type || file.name.split(".").pop() : "manual",
        items: detectedItems.map((item) => {
          const computedPrecioUnitario = item.precioUnitario ?? item.precio ?? item.precioCompra ?? item.precioTotal ?? 0;
          const computedPrecioTotal = item.precioTotal ?? (item.cantidad && item.cantidad > 0 ? computedPrecioUnitario * item.cantidad : undefined);
          return {
            productoId: item.productoId,
            nombreDetectado: item.nombreDetectado || item.nombreOCR || "",
            nombreOCR: item.nombreOCR || item.nombreDetectado,
            nombreGenerico: item.nombreGenerico,
            laboratorio: item.laboratorio,
            cantidad: item.cantidad ?? undefined,
            cantidadUnidad: item.cantidadUnidad,
            precio: computedPrecioUnitario,
            precioUnitario: item.precioUnitario ?? computedPrecioUnitario,
            precioTotal: computedPrecioTotal,
            presentacion: item.presentacion
          };
        })
      };
      const response = await fetch("/api/cotizaciones/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || "No se pudo guardar la cotización.");
      }
      setDetectedItems([]);
      setManualText("");
      setFile(null);
      setMessage({ type: "success", text: "Cotización guardada correctamente." });
      setTimeout(() => {
        router.refresh();
      }, 300);
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "Error guardando la cotización." });
    } finally {
      setProcessing(false);
    }
  }

  async function handleDeleteCotizacion(id: string) {
    if (!confirm("Eliminar esta cotización? Esta acción no se puede deshacer.")) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/cotizaciones/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error("No se pudo eliminar la cotización.");
      setMessage({ type: "success", text: "Cotización eliminada." });
      setTimeout(() => router.refresh(), 200);
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "Error eliminando la cotización." });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileUp className="h-5 w-5 text-orange-600" />
                <CardTitle>Subir lista de precios</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <select
                    value={selectedProviderId}
                    onChange={(event) => setSelectedProviderId(event.target.value)}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                  >
                    {providers.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de cotización</Label>
                  <Input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Archivo</Label>
                <Input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,text/plain" onChange={onFileChange} />
                <p className="text-sm text-slate-500">Formato compatible: {fileSupportText}</p>
              </div>
              <Button disabled={processing || !file} onClick={handleParseFile} className="w-full bg-orange-500 hover:bg-orange-600">
                {processing ? "Extrayendo..." : "Extraer productos"}
              </Button>

              {ocrText && (
                <details className="mt-4 p-3 bg-slate-100 rounded-md border border-slate-300">
                  <summary className="cursor-pointer font-semibold text-sm">
                    📄 Texto OCR extraído ({ocrText.length} caracteres)
                  </summary>
                  <pre className="mt-3 p-3 bg-white rounded border border-slate-200 overflow-auto max-h-80 text-xs whitespace-pre-wrap break-words">
                    {ocrText}
                  </pre>
                </details>
              )}

              <Card className="mt-4">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-slate-700" />
                    <CardTitle>Debug del flujo OCR → parser</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">OCR recibido</p>
                      <p className="mt-2 text-base font-semibold">{parserTrace.ocrReceived} caracteres</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Preprocesamiento iniciado</p>
                      <p className="mt-2 text-base font-semibold">{parserTrace.preprocesamientoStarted ? "sí" : "no"}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Cantidad de líneas detectadas</p>
                      <p className="mt-2 text-base font-semibold">{parserTrace.linesDetected}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Cantidad de líneas candidatas</p>
                      <p className="mt-2 text-base font-semibold">{parserTrace.candidateLines}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Parser llamado</p>
                      <p className="mt-2 text-base font-semibold">{parserTrace.parserCalled ? "sí" : "no"}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Parser ejecutado</p>
                      <p className="mt-2 text-base font-semibold">{parserTrace.parserRun ? "sí" : "no"}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Productos parseados</p>
                    <p className="mt-2 text-base font-semibold">{parserTrace.parserItems}</p>
                  </div>
                  {parserTrace.parserError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                      <p className="font-semibold">Motivo</p>
                      <p>{parserTrace.parserError}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {parserDebug && (
                <Card className="mt-4">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Barcode className="h-5 w-5 text-slate-700" />
                      <CardTitle>Líneas interpretadas como producto</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm text-slate-700">
                      <div>
                        <p className="font-semibold">OCR original:</p>
                        <pre className="mt-2 rounded-md border border-slate-200 bg-white p-3 text-xs whitespace-pre-wrap break-words">
{parserDebug.originalLines.join("\n")}
                        </pre>
                      </div>

                      <div>
                        <p className="font-semibold">OCR unido:</p>
                        <pre className="mt-2 rounded-md border border-slate-200 bg-white p-3 text-xs whitespace-pre-wrap break-words">
{parserDebug.mergedLines.join("\n")}
                        </pre>
                      </div>

                      <div>
                        <p className="font-semibold">Productos parseados:</p>
                        <div className="space-y-2">
                          {parserDebug.parsedLines.map((entry, index) => (
                            <div key={`${entry.line}-${index}`} className="rounded-md border border-slate-200 bg-white p-3">
                              <p className="font-semibold">Línea:</p>
                              <pre className="mt-1 text-xs whitespace-pre-wrap break-words">{entry.line}</pre>
                              {entry.item ? (
                                <div className="mt-2 rounded-md border border-green-200 bg-green-50 p-3 text-xs">
                                  <pre>{JSON.stringify({
                                    nombre: entry.item.nombreDetectado,
                                    presentacion: entry.item.presentacion,
                                    precio: entry.item.precio,
                                    confianza: Number((entry.item.confianza ?? 0) / 100).toFixed(2)
                                  }, null, 2)}</pre>
                                </div>
                              ) : (
                                <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                                  {entry.rejectedReason ?? "rechazado: motivo desconocido"}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Barcode className="h-5 w-5 text-slate-700" />
                <CardTitle>Entrada manual rápida</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={manualText}
                onChange={(event) => setManualText(event.target.value)}
                placeholder="Ej: Dipirona - 25000"
                rows={6}
              />
              <Button disabled={processing || !manualText.trim()} onClick={handleParseManual} className="w-full">
                {processing ? "Procesando..." : "Detectar precios"}
              </Button>
            </CardContent>
          </Card>

          {detectedItems.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-slate-700" />
                  <CardTitle>Productos detectados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resumen de categorías */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm text-green-700">✓ Aceptados</p>
                    <p className="mt-2 text-2xl font-semibold text-green-900">
                      {detectedItems.filter((i) => i.confianza! >= 80).length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">⚠ Dudosos</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-900">
                      {detectedItems.filter((i) => i.confianza! >= 60 && i.confianza! < 80).length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">✗ Rechazados</p>
                    <p className="mt-2 text-2xl font-semibold text-red-900">
                      {detectedItems.filter((i) => i.confianza! < 60).length}
                    </p>
                  </div>
                </div>

                {/* Tabla de productos */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>OCR detectado</TableHead>
                        <TableHead>Nombre corregido</TableHead>
                        <TableHead>Nombre genérico</TableHead>
                        <TableHead>Presentación</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Laboratorio</TableHead>
                        <TableHead>Precio unitario</TableHead>
                        <TableHead>Precio total</TableHead>
                        <TableHead>Confianza</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Producto catálogo</TableHead>
                        <TableHead>Revisado</TableHead>
                        <TableHead>Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detectedItems.map((item, index) => {
                        const bgClass =
                          item.confianza! >= 80
                            ? "bg-green-50"
                            : item.confianza! >= 60
                              ? "bg-amber-50"
                              : "bg-red-50";
                        return (
                          <TableRow key={`${item.nombreDetectado}-${index}`} className={bgClass}>
                            <TableCell className="min-w-[220px]">
                              <Textarea value={item.nombreOCR} readOnly rows={2} className="h-full" />
                            </TableCell>
                            <TableCell>
                              <Input value={item.nombreDetectado} onChange={updateDetectedItem(index, "nombreDetectado")} />
                            </TableCell>
                            <TableCell>
                              <Input value={(item as any).nombreGenerico ?? ""} onChange={updateDetectedItem(index, "nombreGenerico" as any)} />
                            </TableCell>
                            <TableCell>
                              <Input value={item.presentacion ?? ""} onChange={updateDetectedItem(index, "presentacion")} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" min="0" step="1" value={(item.cantidad ?? "") as any} onChange={updateDetectedItem(index, "cantidad" as any)} />
                            </TableCell>
                            <TableCell>
                              <Input value={item.laboratorio ?? ""} onChange={updateDetectedItem(index, "laboratorio")} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" min="0" step="0.01" value={(item.precioUnitario ?? item.precio ?? item.precioCompra ?? item.precioTotal ?? "").toString()} onChange={updateDetectedItem(index, "precioUnitario" as any)} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" min="0" step="0.01" value={(item.precioTotal ?? item.precio ?? item.precioUnitario ?? item.precioCompra ?? "").toString()} onChange={updateDetectedItem(index, "precioTotal" as any)} />
                            </TableCell>
                            <TableCell>
                              <span className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${
                                item.confianza! >= 80
                                  ? "bg-green-200 text-green-900"
                                  : item.confianza! >= 60
                                    ? "bg-amber-200 text-amber-900"
                                    : "bg-red-200 text-red-900"
                              }`}>
                                {Math.round(item.confianza! ?? 0)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <Input value={item.estado ?? ""} readOnly />
                            </TableCell>
                            <TableCell>
                              <Input value={selectedProviderName} readOnly />
                            </TableCell>
                            <TableCell>
                              <select value={item.productoId ?? ""} onChange={updateDetectedItem(index, "productoId")} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
                                <option value="">Crear como nuevo producto</option>
                                {products.map((producto) => (
                                  <option key={producto.id} value={producto.id}>
                                    {producto.nombre}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                            <TableCell>
                              <label className="flex items-center gap-2">
                                <input type="checkbox" checked={item.revisado ?? false} onChange={updateDetectedItem(index, "revisado")} className="h-4 w-4 rounded border-slate-300" />
                                <span className="text-sm">{item.revisado ? "✓" : "Pendiente"}</span>
                              </label>
                            </TableCell>
                            <TableCell>
                              <button type="button" className="text-slate-500 hover:text-slate-900" onClick={() => setDetectedItems((current) => current.filter((_, idx) => idx !== index))}>
                                <X className="h-4 w-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-sm font-semibold">Líneas interpretadas como producto</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-700">
                    {detectedItems.map((item, index) => (
                      <div key={`${item.nombreOCR}-${index}`} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                        {item.nombreOCR}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button disabled={processing} onClick={handleSaveCotizacion} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600">
                    {processing ? "Guardando cotización..." : "Guardar cotización"}
                  </Button>
                  <Button type="button" variant="outline" onClick={addManualProduct} className="w-full sm:w-auto">
                    Agregar producto manual
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-slate-700" />
                <CardTitle>Comparación automática</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Cotizaciones registradas</p>
                  <p className="mt-2 text-2xl font-semibold">{cotizaciones.length}</p>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Productos detectados</p>
                  <p className="mt-2 text-2xl font-semibold">{cotizaciones.flatMap((cot) => cot.items).length}</p>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Proveedores</p>
                  <p className="mt-2 text-2xl font-semibold">{providers.length}</p>
                </div>
              </div>
              {comparisons.slice(0, 3).map((comparison) => (
                <div key={comparison.product} className="rounded-lg border bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">{comparison.product}</p>
                  <p className="mt-1 text-base font-semibold">Proveedor más barato: {comparison.bestProvider}</p>
                  <p className="text-sm text-slate-600">Ahorro frente al segundo mejor: {formatCurrency(comparison.savings)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-slate-700" />
                  <CardTitle>Cotizaciones recientes</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Buscar" value={search} onChange={(event) => setSearch(event.target.value)} className="w-48" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm">
                  <option value="">Todos los proveedores</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.nombre}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm">
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="procesado">Procesado</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Estado OCR</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCotizaciones.map((cotizacion) => (
                      <TableRow
                        key={cotizacion.id}
                        className="cursor-pointer hover:bg-slate-100"
                        onClick={() => setSelectedCotizacion(cotizacion)}
                      >
                        <TableCell>{cotizacion.proveedor.nombre}</TableCell>
                        <TableCell>{formatDate(cotizacion.fecha)}</TableCell>
                        <TableCell>{cotizacion.archivoNombre}</TableCell>
                        <TableCell>{cotizacion.items.length}</TableCell>
                        <TableCell>{cotizacion.estadoOcr}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCotizacion(cotizacion.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {message ? (
        <div className={`rounded-md px-4 py-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      ) : null}

      {selectedCotizacion && (
        <CotizacionDetailModal
          cotizacion={selectedCotizacion}
          onClose={() => setSelectedCotizacion(null)}
          onSaved={() => setSelectedCotizacion(null)}
        />
      )}
    </div>
  );
}
