import { NextResponse } from "next/server";
import { parseDetectedItemsWithDebug, parseDetectedItems } from "@/lib/cotizacion-parser";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";

async function extractTextFromPDF(uint8: Uint8Array) {
  const loadingTask = pdfjsLib.getDocument({ data: uint8 });
  const pdf = await loadingTask.promise;
  const parts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group items by Y position to reconstruct lines
    type TextItem = { str: string; x: number; y: number; width: number };
    const itemsByLine: Map<number, TextItem[]> = new Map();

    for (const item of content.items as TextItem[]) {
      const y = Math.round(item.y);
      if (!itemsByLine.has(y)) {
        itemsByLine.set(y, []);
      }
      itemsByLine.get(y)!.push(item);
    }

    // For each line, sort by X and join with space-preservation
    const lineTexts: string[] = [];
    for (const [_y, items] of itemsByLine) {
      items.sort((a, b) => a.x - b.x);

      // Build line with gap detection: if gap > 15 points, add multiple spaces to preserve column info
      const lineParts: string[] = [];
      let lastItemEnd = 0;

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const gapSize = item.x - lastItemEnd;

        // If there's a significant gap, use multiple spaces (treated as separator for splitTableColumns)
        if (gapSize > 15 && lineParts.length > 0) {
          const spaceCount = Math.max(2, Math.ceil(gapSize / 10));
          lineParts.push(" ".repeat(spaceCount));
        } else if (lineParts.length > 0 && !item.str.match(/^[.,;:!?]/) && !lineParts[lineParts.length - 1].endsWith(" ")) {
          lineParts.push(" ");
        }

        lineParts.push(item.str);
        lastItemEnd = item.x + (item.width || 0);
      }

      lineTexts.push(lineParts.join(""));
    }

    parts.push(lineTexts.join("\n"));
  }

  return parts.join("\n");
}

async function extractTextFromImage(buffer: Uint8Array) {
  const worker = createWorker({
    // logger: (m) => console.log("tesseract", m)
  });
  try {
    await worker.load();
    await worker.loadLanguage("spa");
    await worker.initialize("spa");
    const { data } = await worker.recognize(buffer);
    return data.text;
  } finally {
    try {
      await worker.terminate();
    } catch (e) {
      // ignore
    }
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let rawText: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (typeof body.text === "string") {
        rawText = body.text;
      } else if (body.base64) {
        // allow base64 image/pdf and hint via body.type
        const b64 = String(body.base64);
        const type = body.type || "image/*";
        const buf = Uint8Array.from(Buffer.from(b64, "base64"));
        if (type.includes("pdf")) rawText = await extractTextFromPDF(buf);
        else rawText = await extractTextFromImage(buf);
      }
    } else if (contentType.includes("multipart/form-data") || contentType.includes("form-data")) {
      // Request.formData() is available in Next API routes
      const form = await (req as any).formData();
      const file = form.get("file") as any | null;
      const textField = form.get("text") as any | null;

      if (textField && typeof textField === "string") {
        rawText = textField;
      } else if (file && typeof file.arrayBuffer === "function") {
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        const filename = file.name || "file";
        const mime = file.type || "";

        if (mime.includes("pdf") || filename.toLowerCase().endsWith(".pdf")) {
          rawText = await extractTextFromPDF(uint8);
        } else {
          rawText = await extractTextFromImage(uint8);
        }
      }
    } else if (contentType.includes("text/plain")) {
      rawText = await req.text();
    } else {
      // fallback: try json then text
      try {
        const body = await req.json();
        if (typeof body.text === "string") rawText = body.text;
      } catch {}
      if (!rawText) {
        try {
          rawText = await req.text();
        } catch {}
      }
    }

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: "no text extracted" }, { status: 400 });
    }

    // Use parser with debug to return useful metadata
    const debug = parseDetectedItemsWithDebug(rawText);

    // Normalize items output for client: map to minimal useful fields
    const parsedItems = debug.items.map((it) => ({
      nombreOCR: it.nombreOCR,
      nombreDetectado: it.nombreDetectado,
      nombreComercial: it.nombreComercial,
      nombreGenerico: it.nombreGenerico,
      presentacion: it.presentacion,
      laboratorio: it.laboratorio,
      cantidad: it.cantidad,
      cantidadUnidad: it.cantidadUnidad,
      precio: it.precio,
      precioUnitario: it.precioUnitario,
      precioTotal: it.precioTotal,
      confianza: it.confianza,
      estado: it.estado
    }));

    return NextResponse.json({
      success: true,
      parsedItems,
      parsedLines: debug.parsedLines,
      mergedLines: debug.mergedLines,
      fallbackUsed: debug.fallbackUsed
    });
  } catch (err: any) {
    console.error("/api/facturas/process error", err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
