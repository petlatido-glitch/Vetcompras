"use client";

import { useState, type ChangeEvent } from "react";
import { extractMergedQuotationLines, extractRawQuotationLines, parseDetectedItems, ParsedCotizacionItem } from "@/lib/cotizacion-parser";

export default function DebugOCRPage() {
  const [ocrText, setOcrText] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedCotizacionItem[]>([]);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [mergedLines, setMergedLines] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const handleTestParse = () => {
    setLogs([]);
    setParsedItems([]);
    setRawLines([]);
    setMergedLines([]);

    if (!ocrText.trim()) {
      alert("Ingresa texto OCR para probar");
      return;
    }

    try {
      const raw = extractRawQuotationLines(ocrText);
      const merged = extractMergedQuotationLines(ocrText);
      const items = parseDetectedItems(ocrText);

      setRawLines(raw);
      setMergedLines(merged);
      setParsedItems(items);
    } catch (error: any) {
      setLogs((prev) => [...prev, `ERROR: ${error.message}`]);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", backgroundColor: "#1e1e1e", color: "#d4d4d4", minHeight: "100vh" }}>
      <h1>🔍 OCR Parser Debug Tool</h1>

      <div style={{ marginBottom: "20px" }}>
        <label>
          <strong>Pega el texto OCR extraído del PDF:</strong>
        </label>
        <textarea
          value={ocrText}
          onChange={(e) => setOcrText(e.target.value)}
          style={{
            width: "100%",
            height: "200px",
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#2d2d2d",
            color: "#d4d4d4",
            border: "1px solid #555",
            fontFamily: "monospace",
            fontSize: "12px"
          }}
          placeholder="Pega aquí el texto extraído del PDF..."
        />
        <button
          onClick={handleTestParse}
          style={{
            marginTop: "10px",
            padding: "10px 20px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "4px"
          }}
        >
          Parse OCR Text
        </button>
      </div>

      {logs.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>📋 Parser Logs:</h3>
          <div
            style={{
              backgroundColor: "#1e1e1e",
              border: "1px solid #555",
              padding: "10px",
              maxHeight: "300px",
              overflowY: "auto",
              fontSize: "11px",
              lineHeight: "1.5"
            }}
          >
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: "5px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {parsedItems.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>✅ Parsed Items ({parsedItems.length}):</h3>
          {parsedItems.map((item, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#2d2d2d",
                border: "1px solid #555",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px"
              }}
            >
              <strong>{item.nombreDetectado}</strong>
              <ul style={{ marginTop: "5px", marginBottom: "0", paddingLeft: "20px" }}>
                <li>Precio: {item.precio ?? "N/A"}</li>
                <li>Presentación: {item.presentacion ?? "N/A"}</li>
                <li>Laboratorio: {item.laboratorio ?? "N/A"}</li>
                <li>Cantidad: {item.cantidadUnidad ?? "N/A"}</li>
                <li>Confianza: {item.confianza ?? "N/A"}</li>
                <li>Revisar: {item.needsReview ? "⚠️ SÍ" : "✓ NO"}</li>
              </ul>
            </div>
          ))}
        </div>
      )}

      {rawLines.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>🔹 Raw OCR lines ({rawLines.length})</h3>
          <pre style={{ backgroundColor: "#252526", padding: "10px", borderRadius: "4px", overflowX: "auto", fontSize: "12px" }}>
            {rawLines.map((line, index) => `${index + 1}. ${line}`).join("\n")}
          </pre>
        </div>
      )}

      {mergedLines.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>🔸 Merged quotation lines ({mergedLines.length})</h3>
          <pre style={{ backgroundColor: "#252526", padding: "10px", borderRadius: "4px", overflowX: "auto", fontSize: "12px" }}>
            {mergedLines.map((line, index) => `${index + 1}. ${line}`).join("\n")}
          </pre>
        </div>
      )}

      <details style={{ marginTop: "20px" }}>
        <summary style={{ cursor: "pointer", color: "#0066cc", marginBottom: "10px" }}>
          📝 Test Examples
        </summary>
        <div style={{ backgroundColor: "#2d2d2d", padding: "10px", borderRadius: "4px", marginTop: "10px" }}>
          <button
            onClick={() =>
              setOcrText(
                "Dipirona 500mg 12 unidades 25.000\nAmoxicilina 500mg 20 capsulas 18.500\nPenicilina procaina 1000000UI inyectable 100ml 35.000"
              )
            }
            style={{
              display: "block",
              marginBottom: "5px",
              padding: "5px 10px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              cursor: "pointer",
              borderRadius: "3px",
              width: "100%",
              textAlign: "left"
            }}
          >
            Test 1: Basic with quantities
          </button>
          <button
            onClick={() =>
              setOcrText(
                "COD-001 Sulfadiazina Plata cream 30g 45.200\nCODIGO: LV-002 Metronidazol 250mg 30 tablets 12.800"
              )
            }
            style={{
              display: "block",
              marginBottom: "5px",
              padding: "5px 10px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              cursor: "pointer",
              borderRadius: "3px",
              width: "100%",
              textAlign: "left"
            }}
          >
            Test 2: With provider codes
          </button>
          <button
            onClick={() =>
              setOcrText(
                "Vacuna antirrábica 52.500\nSuero fisiológico 250ml 3.800\nAlcohol 70% 500ml 4.200"
              )
            }
            style={{
              display: "block",
              padding: "5px 10px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              cursor: "pointer",
              borderRadius: "3px",
              width: "100%",
              textAlign: "left"
            }}
          >
            Test 3: Minimal info
          </button>
        </div>
      </details>

      <p style={{ marginTop: "20px", fontSize: "12px", color: "#888" }}>
        💡 Tip: Copia el texto OCR extraído de tu PDF y pégalo aquí para ver qué detecta el parser en tiempo real.
      </p>
    </div>
  );
}
