export type ParsedCotizacionItem = {
  nombreOCR: string;
  nombreDetectado: string;
  nombreComercial?: string;
  nombreGenerico?: string;
  presentacion?: string;
  concentracion?: string;
  laboratorio?: string;
  cantidadUnidad?: string;
  cantidad?: number | null;
  precio?: number | null;
  precioCompra?: number | null;
  precioUnitario?: number | null;
  precioTotal?: number | null;
  proveedorCodigo?: string;
  proveedor?: string;
  fecha?: string;
  confianza?: number;
  estado?: string;
  needsReview?: boolean;
  revisado?: boolean;
};

const HEADER_REGEX = /\b(NIT|RUC|FECHA|VENDEDOR|CIUDAD|DIRECCI[ÓO]N|TEL(?:[ÉE]FONO)?|BODEGA|NOTA|NOTAS|SUBTOTAL|TOTAL|IVA|P[AÁ]GINA|CLIENTE|COTIZACI[ÓO]N|CONDICIONES|FORMA DE PAGO|PLAZO|PEDIDO|REFERENCIA|OBSERVACIONES|CANTIDAD|CANT|COD(?:IGO)?|CÓDIGO|FACTURA|FACTURACI[ÓO]N|MONTO|SALDO|PAGADO|CONCEPTO|SERIE|DOCUMENTO)\b/i;
const IGNORE_PRICE_HEADER_REGEX = /\b(TOTAL|SUBTOTAL|IVA|DESCUENTO|NETO|IMPORTE|GRAVADO|PAGO|INTERES|SEGURO|RETENCI[ÓO]N|M[ÓO]VIL|DEBITO|CREDITO)\b/i;
const ADMIN_LINE_REGEX = /\b(?:factura|nit|ruc|cliente|vendedor|direcci[óo]n|tel[eé]fono|email|subtotal|total|iva|descuento|neto|importe|gravado|pago|interes|seguro|retencion|observaciones|nota|referencia|pedido|cotizaci[óo]n|forma de pago|plazo|condiciones|p[aá]gina|serie|documento|monto|saldo|pagado|caja|cajero|facturaci[óo]n|fecha de emision)\b/i;
const CODE_REGEX = /\b(?:C(?:O|Ó)D(?:IGO)?|REF|COD|NIT|RUC)[:\-]?\s*([A-Z0-9\-\/]+)\b/i;
const LAB_MARKER_REGEX = /\b(osa|mk|bayer|pfizer|merck|lilly|novo|roche|sandoz|tecnoquímicas|procaps|provet|lavet|syntec|andrómaco|clorvet|vetoquinol|zoetis|biogénesis|biogenesis|arroyo|norstray)\b/i;
const LAB_PREFIX_REGEX = /\b(?:LAB(?:ORATORIO)?|LAB\.)\s+[A-Z][A-Z0-9]*(?:\s+[A-Z][A-Z0-9]*)*\b/i;
const PRODUCT_HINT_REGEX = /\b(agua esteril|agua oxigenada|dipirona|alcohol|ampidet|ampicilina|sulbactam|norstray|osa|mk|bayer|pfizer|merck|lilly|novo|roche|sandoz|tecnoquímicas|procaps|provet|lavet|syntec|andrómaco|clorvet|vetoquinol|zoetis|biogénesis|biogenesis|meloxicam|carprofeno|enrofloxacina|amoxicilina|cefalexina|cefalexin|gentamicina|cefazolina|ivermectina|itraconazol|tableta|caja|bolsa|vial|frasco|ampolla|gal[óo]n)\b/i;
const TABULAR_HEADER_REGEX = /\b(?:c[oó]digo|descripci[oó]n|laboratorio|lote|cantidad|u\/?m|valor\s*und|valor\s*total|iva|subtotal|total)\b/i;
const TABLE_HEADER_TOKENS = [
  "código",
  "descripción",
  "laboratorio",
  "lote",
  "cantidad",
  "u/m",
  "u m",
  "valor und",
  "iva",
  "valor total",
  "subtotal",
  "total"
];

const PRICE_REGEX_SOURCE = "(?:\\$\\s*)?(?:\\d{1,3}(?:\\.\\d{3})+(?:,\\d{1,2})?|\\d{4,}(?:[.,]\\d{1,2})?|\\d+(?:,\\d{2}))";
const PRICE_REGEX = new RegExp(PRICE_REGEX_SOURCE);
const PRICE_GLOBAL_REGEX = new RegExp(PRICE_REGEX_SOURCE, "g");
const CONTINUATION_MARKER_REGEX = /\b(?:ml|mg|g|vial|ampolla|bolsa|gal[óo]n|caja|cj|sobre|laboratorio|marca|unidad|unidades|precio)\b/i;
const PRICE_EXCLUDE_CONTEXT_REGEX = /(?:mg|mcg|g|kg|ml|cc|l|ui|ui\/ml|ml\/kg|unidades?|unidad|viales?|tabletas?|comprimidos?|capsulas?|caps|tab|tabs|ampollas?|frasco|frascos?|caja|bolsa|pack|paquete)\b/i;
const PRESENTATION_NUMBER_REGEX = /(\d+(?:[.,]\d+)?)\s*(mg|mcg|g|kg|ml|cc|l|ui|ui\/ml|ml\/kg)/i;
const PRESENTATION_CONTAINER_REGEX = /\b(bolsa|bolsas|gal[óo]n|frasco|vial|viales|ampolla|ampollas|caja|cjx|cj|sobre|tableta|tabletas|comprimido|comprimidos|unidad|unidades|pack|paquete)\b/i;
const QUANTITY_REGEX = /(?:\b(?:cjx|cj|caja|bolsa|pack|paquete)\s*)?(?:x|×)\s*(\d+)\b|\b(\d+)\s*(?:unidades?|unidad|viales?|tabletas?|comprimidos?|capsulas?|caps|tab|tabs|ampollas?|ampolla|frasco|frascos?)\b/i;
const GENERIC_PAREN_REGEX = /\(([^)]+)\)/;
const GENERIC_TEXT_REGEX = /\b(?:gen(?:érico|erico)|g[ée]nico)[:\-]?\s*([^\n\r]+)/i;

const MEDICAL_TERMS_REGEX = /\b(?:ampicilina|ceftriaxona|omeprazol|metronidazol|tramadol|ondansetron|sutura|sutura\s+nylon|monofilamento|nylon|inyecci[oó]n|inyectable|vial|viales|ampolla|ampollas|soluci[oó]n|usp|frasco|fco|tableta|mg|ml|gr|g|caja|presentaci[oó]n|uso\s+veterinario|veterinaria|intravenoso|intramuscular|suspensi[oó]n|c[aá]psula|c[aá]psulas|sodica|sódica|clorhidrato)\b/i;
const STRONG_PRODUCT_TERMS_REGEX = /\b(?:mg|ml|gr|g|vial|viales|ampolla|ampollas|caja|x|soluci[oó]n|usp|inyectable|suspensi[oó]n|comprimido|comprimidos|tableta|tabletas|c[aá]psula|c[aá]psulas|frasco|fco|marca|veterinaria|uso\s+veterinario|intravenoso|intramuscular|sodica|sódica|nylon|monofilamento)\b/i;
const BOX_LIKE_REGEX = /\b(?:caja|fco|frasco|vial|ampolla|pack|paquete|cjx|cj)\b/i;

// Palabras clave que causan rechazo automático (líneas administrativas)
const PROHIBITED_KEYWORDS = [
  'subtotal', 'iva', 'nit', 'ruc',
  'dirección', 'dirección:',
  'teléfono', 'tel', 'telefono', 'cel', 'celular', 'móvil', 'movil',
  'email', 'correo', 'mail',
  'observación', 'observaciones', 'nota', 'notas',
  'forma de pago', 'transferencia',
  'vencimiento', 'plazo', 'condiciones',
  'total', 'neto', 'gravado', 'descuento',
  'porcentaje',
  'página', 'pág',
  'fecha', 'fecha emision', 'emitido',
  'cliente', 'vendedor', 'proveedor',
  'factura', 'cotización',
  'cuenta bancaria', 'transacción',
  'aceptado', 'aprobado', 'rechazado',
  'línea', 'concepto', 'referencia'
];

function hasProhibitedKeyword(line: string): boolean {
  const normalized = line.toLowerCase().replace(/[^\w\s]/g, ' ');
  for (const keyword of PROHIBITED_KEYWORDS) {
    if (normalized.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function calculateConfidence(item: ParsedCotizacionItem): number {
  let score = 0;

  // Precio válido: +30 puntos
  if (item.precio && item.precio > 100) {
    score += 30;
  } else if (item.precio) {
    score += 15;
  }

  // Nombre detectado con longitud suficiente: +20 puntos
  if (item.nombreDetectado && item.nombreDetectado.trim().length > 5) {
    score += 20;
  }

  // Presentación: +25 puntos
  if (item.presentacion && item.presentacion.trim().length > 0) {
    score += 25;
  }

  // Laboratorio: +15 puntos
  if (item.laboratorio && item.laboratorio.trim().length > 0) {
    score += 15;
  }

  // Cantidad: +10 puntos
  if (item.cantidad) {
    score += 10;
  }

  // Penalización: si el nombre es sospechosamente corto o contiene solo números
  const nameAsNumbers = item.nombreDetectado?.replace(/[^0-9]/g, '');
  if (nameAsNumbers && nameAsNumbers.length > item.nombreDetectado!.length * 0.7) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

export function normalizeProductName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[+&\/\-]/g, " + ")
    .replace(/[^a-z0-9\s+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalizeProductName(value: string) {
  const normalized = normalizeProductName(value);
  if (!normalized) return "";

  const ALIAS_CANONICAL: Record<string, string[]> = {
    metamizol: ["dipirona", "dipirona sodica", "metamizol", "metamizol sodico"],
    "ampicilina + sulbactam": ["ampicilina sulbactam", "ampicilina+sulbactam", "ampicilina y sulbactam", "ampicilina/sulbactam"],
    amoxicilina: ["amoxicilina", "amoxicilina trihidrato"],
    cefalexina: ["cefalexina", "cefalexin"],
    ivermectina: ["ivermectina"],
    enrofloxacina: ["enrofloxacina"],
    meloxicam: ["meloxicam"],
    carprofeno: ["carprofeno"],
    cefazolina: ["cefazolina"],
    gentamicina: ["gentamicina"],
    tilosina: ["tilosina"],
    itraconazol: ["itraconazol"]
  };

  for (const canonical of Object.keys(ALIAS_CANONICAL)) {
    const aliasSet = ALIAS_CANONICAL[canonical].map((alias) => normalizeProductName(alias));
    if (aliasSet.includes(normalized) || normalizeProductName(canonical) === normalized) {
      return canonical;
    }
  }

  return normalized.replace(/\s*\+\s*/g, " + ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/\$/g, "").replace(/\./g, "").replace(/,/g, ".");
  return Number(cleaned);
}

type PriceInfo = {
  raw: string;
  index: number;
  precio: number;
};

const PRICE_CONTEXT_EXCLUDE_REGEX = /\b(?:lot(?:e)?|ref(?:erencia)?|fc|d\d{2}|h\d{2}|n\d{2}|cod(?:igo)?|cód(?:igo)?|ean|gtin|barcode|barra|serie|nro|num|no|lote|sku|internal|interno)\b/i;

function extractPriceCandidates(text: string): PriceInfo[] {
  const matches = Array.from(text.matchAll(PRICE_GLOBAL_REGEX));
  return matches
    .map((match) => ({
      raw: match[0],
      index: match.index ?? 0,
      precio: parseNumber(match[0])
    }))
    .filter((candidate) => isPriceCandidate(text, { 0: candidate.raw, index: candidate.index, length: candidate.raw.length } as RegExpMatchArray));
}

function derivePriceBreakdown(line: string, quantity?: number | null) {
  const candidates = extractPriceCandidates(line);
  if (!candidates.length) {
    return { precioUnitario: undefined as number | null, precioTotal: undefined as number | null };
  }

  if (candidates.length >= 2) {
    const last = candidates[candidates.length - 1];
    const prev = candidates[candidates.length - 2];
    const lowerLine = line.toLowerCase();
    const totalLabel = /\b(total|valor total|imp(?:orte)? total|subtotal|neto)\b/i.test(lowerLine);

    if (totalLabel) {
      return {
        precioUnitario: prev.precio,
        precioTotal: last.precio
      };
    }

    if (quantity && quantity > 1) {
      const unit = candidates[0].precio;
      const total = candidates[1].precio;
      if (Math.abs(unit * quantity - total) <= Math.max(1, total * 0.05)) {
        return { precioUnitario: unit, precioTotal: total };
      }
    }

    if (prev.precio > 0 && last.precio > 0 && last.precio >= prev.precio) {
      return { precioUnitario: prev.precio, precioTotal: last.precio };
    }
  }

  return { precioUnitario: candidates[0].precio, precioTotal: undefined };
}

function statusFromConfidence(confidence: number) {
  if (confidence >= 80) return "aceptado";
  if (confidence >= 60) return "dudoso";
  return "revisar manualmente";
}

function enrichParsedItem(item: ParsedCotizacionItem): ParsedCotizacionItem {
  const confidence = calculateConfidence(item);
  const parsedNames = parseProductNames(item.nombreDetectado || item.nombreOCR || "");
  return {
    ...item,
    nombreDetectado: parsedNames.cleanedName || item.nombreDetectado || item.nombreOCR || "",
    nombreGenerico: item.nombreGenerico || parsedNames.nombreGenerico,
    confianza: confidence,
    estado: item.estado || statusFromConfidence(confidence),
    needsReview: item.needsReview ?? confidence < 80
  };
}

function isPriceCandidate(text: string, match: RegExpMatchArray) {
  const index = match.index ?? 0;
  const candidate = match[0];
  const before = text.slice(Math.max(0, index - 24), index).toLowerCase();
  const after = text.slice(index + candidate.length, index + candidate.length + 24).toLowerCase();
  // If the overall line contains medical terms, prefer the candidate (don’t aggressively exclude)
  if (MEDICAL_TERMS_REGEX.test(text)) return true;
  // Don't exclude price-like tokens if the line contains medical terms (whitelist)
  const hasMedical = MEDICAL_TERMS_REGEX.test(text);
  if (!hasMedical && PRICE_EXCLUDE_CONTEXT_REGEX.test(`${before} ${after}`)) return false;
  if (!hasMedical && PRICE_CONTEXT_EXCLUDE_REGEX.test(`${before} ${after}`)) return false;
  const digits = candidate.replace(/[^0-9]/g, "");
  if (!candidate.startsWith("$") && digits.length >= 7 && !candidate.includes(",") && !candidate.includes(".")) {
    return false;
  }
  if (/\b\d{7,13}\b/.test(candidate) && !candidate.includes("$") && !candidate.includes(",") && !candidate.includes(".")) {
    return false;
  }
  return true;
}

function hasPrice(text: string) {
  return PRICE_REGEX.test(text);
}

type PriceCandidate = {
  raw: string;
  index: number;
  parsed: number;
  valid: boolean;
};

function scorePriceCandidate(candidate: PriceCandidate, textLength: number, isLastCandidate: boolean) {
  if (!candidate.valid) return -Infinity;
  let score = 0;

  if (/^\$/.test(candidate.raw)) score += 40;
  if (candidate.raw.includes(",") || candidate.raw.includes(".")) score += 20;
  if (/^\$?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(candidate.raw)) score += 20;
  if (/^\$?\d+(?:,\d{2})?$/.test(candidate.raw)) score += 10;

  if (candidate.parsed >= 10000000) score -= 50;
  if (candidate.parsed >= 1000000 && !candidate.raw.includes("$") && !candidate.raw.includes(",") && !candidate.raw.includes(".")) score -= 25;
  if (candidate.parsed < 500) score -= 20;

  const relativePosition = candidate.index / Math.max(1, textLength);
  score += Math.round(relativePosition * 12);

  if (isLastCandidate) score += 20;

  return score;
}

function extractPriceInfo(text: string): PriceInfo | undefined {
  PRICE_GLOBAL_REGEX.lastIndex = 0;
  const matches = Array.from(text.matchAll(PRICE_GLOBAL_REGEX));
  if (!matches.length) return undefined;

  const candidates = matches
    .map((match) => ({
      raw: match[0],
      index: match.index ?? 0,
      parsed: parseNumber(match[0]),
      valid: isPriceCandidate(text, match)
    }))
    .filter((candidate) => candidate.valid && Number.isFinite(candidate.parsed) && candidate.parsed > 0);

  if (!candidates.length) return undefined;

  const lastIndex = Math.max(...candidates.map((candidate) => candidate.index));
  const sorted = candidates
    .map((candidate) => ({
      ...candidate,
      score: scorePriceCandidate(candidate, text.length, candidate.index === lastIndex)
    }))
    .sort((a, b) => b.score - a.score || b.index - a.index);

  const chosen = sorted[0];
  return chosen ? { raw: chosen.raw, index: chosen.index, precio: chosen.parsed } : undefined;
}

function extractPrice(text: string) {
  return extractPriceInfo(text)?.precio;
}

export function extractPrecioSeguro(text: string) {
  return extractPrice(text);
}

function parsePresentation(text: string) {
  const numberMatch = text.match(PRESENTATION_NUMBER_REGEX);
  const containerMatch = text.match(PRESENTATION_CONTAINER_REGEX);
  if (numberMatch && containerMatch) {
    return `${numberMatch[1].replace(/\s+/g, "").toLowerCase()} ${numberMatch[2].toLowerCase()} ${containerMatch[1].toLowerCase()}`.replace(/\s+/g, " ").trim();
  }
  if (numberMatch) {
    return `${numberMatch[1].replace(/\s+/g, "").toLowerCase()} ${numberMatch[2].toLowerCase()}`;
  }
  if (containerMatch) {
    return containerMatch[1].toLowerCase();
  }
  return undefined;
}

function parseQuantity(text: string) {
  const match = text.match(QUANTITY_REGEX);
  if (!match) return undefined;
  const value = match[1] || match[2];
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : undefined;
}

function parseLaboratory(text: string) {
  const prefixMatch = text.match(LAB_PREFIX_REGEX);
  if (prefixMatch) return prefixMatch[0].trim();

  const match = text.match(LAB_MARKER_REGEX);
  if (match) return match[1].trim();

  const tokens = text.split(/\s+/).filter((token) => /^[A-Z]{2,5}$/.test(token));
  return tokens.length === 1 ? tokens[0] : undefined;
}

function removeTechnicalCodes(text: string) {
  return text
    .replace(/\b(?:FC\d+|IQM|D\d{2}|H\d{2}|N\d{2}|LOTE|LOT|REF(?:ERENCIA)?|COD(?:IGO)?|CÓDIGO|EAN|GTIN|BARCODE|BARRA|SERIE|NRO|NUM|NO|SKU)\b[:\-]?\s*[A-Z0-9-\/]+/gi, " ")
    .replace(/\b(?:FC\d+|IQM|D\d{2}|H\d{2}|N\d{2})\b/gi, " ")
    .replace(/\b\d{7,13}\b/g, " ")
    .replace(/\b[A-Z0-9]{2,4}\d{2,6}\b/g, " ")
    .replace(/\b(?:UND|UND\.|UN|U\.N\.|CJX|CJ|CAJA|BOLSA|PACK|PAQ|PK|ITEM|REF|CÓDIGO|CODIGO|SKU|IQM|FC)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSpelledOut(text: string) {
  const spacedLetters = text.match(/(?:\b[A-Z]\b[\s\-]+){3,}/gi);
  return Boolean(spacedLetters);
}

function cleanProductName(text: string): string {
  let cleaned = text.trim();

  // Remover cantidades al inicio (100, 50, etc)
  cleaned = cleaned.replace(/^\s*\d+\s+(?=\w)/i, " ");

  // Remover códigos FC + números: FC003570, FC001, etc.
  cleaned = cleaned.replace(/\bFC\d+\b/gi, " ");

  // Remover códigos IA + números: IA2415, IA001, etc.
  cleaned = cleaned.replace(/\bIA\d+\b/gi, " ");

  // Remover códigos alfanuméricos cortos: A0033, H01, etc. (letra + 2-4 dígitos)
  cleaned = cleaned.replace(/\b[A-Z]\d{2,4}\b/g, " ");

  // Remover "Und", "UND", "und", etc.
  cleaned = cleaned.replace(/\b(?:Und|UND|und)\b/gi, " ");

  // Remover nombres de proveedores comunes al inicio
  // INCOLMEDIC, OSA, MK, etc. (palabras solas en mayúsculas que suelen ser proveedores)
  cleaned = cleaned.replace(/^\s*(?:INCOLMEDIC|INCOLMÉDIC|INCOLMEDICA|OSA|MK|BAYER|PFIZER|MERCK|LILLY|NOVO|ROCHE|SANDOZ|TECNOQUÍMICAS|PROCAPS|PROVET|LAVET|SYNTEC|ANDRÓMACO|CLORVET|VETOQUINOL|ZOETIS|BIOGÉNESIS|BIOGENESIS|ARROYO|NORSTRAY)\b\s*/gi, " ");

  // Remover referencias de inventario (palabras cortas aisladas que preceden a descripciones)
  // Esto se aplica a palabras de 2-4 caracteres que no son palabras comunes de producto
  cleaned = cleaned.replace(/^\s*\b[A-Z]{2,4}\b\s+(?=[A-Za-z])/g, " ");

  // Normalizar espacios
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

function extractMinimalProductName(text: string) {
  let cleaned = removeTechnicalCodes(text);
  cleaned = cleaned
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:UNIDAD|UND|CAJA|ITEM|REF|CÓDIGO|CODIGO|SKU|IQM|FC|FCO|FCO\b|MD|SE|SC)\b/gi, " ")
    .replace(/\b(?:TECNOMEDIC A MD|TECNOMEDIC|PROVEEDOR|LABORATORIO|LAB\.)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const presentation = parsePresentation(cleaned);
  if (presentation) {
    cleaned = cleaned.replace(new RegExp(escapeRegExp(presentation), "gi"), " ").trim();
  }

  cleaned = cleaned.replace(/\b\d+\b(?![%mgmll])/gi, " ").replace(/\s+/g, " ").trim();

  if (isSpelledOut(cleaned)) {
    return undefined;
  }

  return cleaned || undefined;
}

function parseProductNames(text: string) {
  let cleaned = removeTechnicalCodes(text.replace(CODE_REGEX, " ")).trim();
  let generic: string | undefined;

  const parenMatch = cleaned.match(GENERIC_PAREN_REGEX);
  if (parenMatch) {
    generic = parenMatch[1].trim();
    cleaned = cleaned.replace(parenMatch[0], " ").trim();
  }

  const genericTextMatch = cleaned.match(GENERIC_TEXT_REGEX);
  if (!generic && genericTextMatch) {
    generic = genericTextMatch[1].trim();
    cleaned = cleaned.replace(genericTextMatch[0], " ").trim();
  }

  const labMatch = cleaned.match(LAB_PREFIX_REGEX);
  if (labMatch) {
    cleaned = cleaned.replace(labMatch[0], " ").trim();
  }

  cleaned = cleaned
    .replace(/\b(?:x|×)\s*\d+\b/gi, " ")
    .replace(/\b(?:cjx|cj|caja|bolsa|pack|paquete)\b/gi, " ")
    .replace(/\b(?:unidades|unidad|viales?|tabletas?|comprimidos?|comprimido|capsulas?|capsula|caps|tab|tabs)\b/gi, " ")
    .replace(/\b(?:mg|mcg|g|kg|ml|cc|l|ui|ui\/ml|ml\/kg)\b/gi, " ")
    .replace(/\b(?:bolsa|gal[óo]n|frasco|vial|ampolla|caja|cjx|cj|sobre|tableta|comprimido|pack|paquete|unidad|unidades)\b/gi, " ")
    .replace(/\b(?:sp\.|usp|u\.s\.p)\b/gi, " ")
    .replace(/^\d+(?!\s*(?:mg|mcg|g|kg|ml|cc|l|ui|ui\/ml|ml\/kg|bolsa|vial|frasco|ampolla|caja|pack|paquete))\b\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const commercial = cleaned.replace(/\b(?:sp\.|usp|u\.s\.p)\b/gi, " ").replace(/\s+/g, " ").trim();
  const cropped = commercial.length > 120 ? commercial.slice(0, 120).trim() : commercial;

  return {
    nombreComercial: cropped || undefined,
    nombreGenerico: generic || undefined,
    cleanedName: cropped || text
  };
}

function splitTableColumns(line: string) {
  // First attempt: split by 2+ spaces (from preserved tabs or actual multiple spaces)
  let columns = line
    .replace(/\t/g, "  ")
    .replace(/\|/g, "  ")
    .split(/ {2,}/)
    .map((segment) => segment.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // If we got only one column and the line looks like it has column markers (FC, prices, etc.),
  // try splitting by single spaces and let the tabular parser reconstruct columns
  if (columns.length === 1 && (/\bFC\d+\b/.test(line) || /\d{4,}\s+\d{4,}/.test(line))) {
    // Split by single space, then we'll reconstruct the logical columns
    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length >= 6) {
      return tokens;
    }
  }

  return columns;
}

function isUnitToken(value: string | undefined) {
  return typeof value === "string" && /^(?:u[ni]d|unidad(?:es)?|viales?|tabletas?|comprimidos?|capsulas?|caps|tab|tabs|caja|bolsa|pack|paquete|cj|cjx|ml|mg|g|l|cc)/i.test(value.trim());
}

function isCodeColumn(text: string) {
  const cleaned = text.trim();
  return /^[A-Z0-9\-\/]{2,20}$/.test(cleaned) && !/[a-záéíóúü]/i.test(cleaned);
}

function reconstructColumnsFromTokens(tokens: string[]): string[] {
  // Reconstruct logical columns from individual tokens when spaces are not used as delimiters
  // E.g.: ["FC001287", "Alcohol", "MK", "3700", "ml", "galón", "TQ", "5J008", "1", "Und", "43500", "43500"]
  // Into: ["Alcohol", "MK 3700 ml galón TQ 5J008", "1", "Und", "43500", "43500"]

  const columns: string[] = [];
  let i = 0;

  // Skip FC code if present
  if (tokens[i] && /^FC\d+/i.test(tokens[i])) {
    i++;
  }

  // Build description (until we hit a known lab marker or code-like token)
  const descParts: string[] = [];
  while (i < tokens.length) {
    const token = tokens[i];
    // Stop if we hit what looks like a lab code (2-5 uppercase letters without accents)
    if (/^[A-Z]{2,5}$/.test(token) && !/[aeiouáéíóú]/i.test(token)) {
      break;
    }
    // Stop if we hit a quantity-like pattern
    if (/^\d+$/.test(token) && i + 1 < tokens.length && /^(?:und|ml|mg|g|l|vial|caja|bolsa|pack)$/i.test(tokens[i + 1])) {
      break;
    }
    descParts.push(token);
    i++;
  }

  if (descParts.length > 0) {
    columns.push(descParts.join(" "));
  }

  // Build lab + codes section (until we hit a quantity)
  const labParts: string[] = [];
  while (i < tokens.length) {
    const token = tokens[i];
    // Stop if we hit a quantity pattern
    if (/^\d+$/.test(token) && i + 1 < tokens.length && /^(?:und|ml|mg|g|l|vial|caja|bolsa|pack)$/i.test(tokens[i + 1])) {
      break;
    }
    labParts.push(token);
    i++;
  }

  if (labParts.length > 0) {
    columns.push(labParts.join(" "));
  }

  // Remaining tokens (quantity, unit, prices)
  while (i < tokens.length) {
    columns.push(tokens[i]);
    i++;
  }

  return columns;
}

function isTabularHeader(text: string) {
  return /^(?:c[oó]digo|descripci[oó]n|laboratorio|lote|cantidad|u\/?m|valor\s*und|iva|valor\s*total|unidad|precio)$/i.test(text.trim());
}

function isHeaderRow(line: string) {
  const normalized = line.replace(/\s+/g, " ").trim();
  return TABULAR_HEADER_REGEX.test(normalized);
}

function parseTabularLineByTokens(line: string) {
  const normalized = line.replace(/\t/g, " ").replace(/\|/g, " ").replace(/\s+/g, " ").trim();
  const tokens = normalized.split(" ");
  if (tokens.length < 6) return null;

  let quantityIndex = -1;
  for (let i = tokens.length - 2; i >= 0; i--) {
    if (/^\d+$/.test(tokens[i]) && isUnitToken(tokens[i + 1])) {
      quantityIndex = i;
      break;
    }
  }
  if (quantityIndex < 0) return null;

  const cantidad = parseNumber(tokens[quantityIndex]);
  const cantidadUnidad = tokens[quantityIndex + 1];
  const rightTokens = tokens.slice(quantityIndex + 2).
    filter((token) => token.trim().length > 0);

  const priceNumbers = rightTokens
    .map((token) => ({ token, value: parseNumber(token) }))
    .filter((entry) => Number.isFinite(entry.value) && entry.value > 0);

  if (!priceNumbers.length) return null;

  let precioUnitario = priceNumbers[0].value;
  let precioTotal: number | undefined;
  if (priceNumbers.length === 2) {
    precioUnitario = priceNumbers[0].value;
    precioTotal = priceNumbers[1].value;
  } else if (priceNumbers.length >= 3) {
    precioTotal = priceNumbers[priceNumbers.length - 1].value;
    precioUnitario = priceNumbers[priceNumbers.length - 2].value;
  }

  const labStart = tokens.findIndex((token, index) => {
    if (/^LAB(?:ORATORIO)?\.?$/i.test(token)) return true;
    if (index >= quantityIndex) return false;
    return LAB_MARKER_REGEX.test(token);
  });
  if (labStart < 0 || labStart >= quantityIndex) return null;

  const laboratory = tokens.slice(labStart, quantityIndex).join(" ").trim();
  if (!laboratory) return null;

  const hasCodeColumn = /^FC\d+/i.test(tokens[0]) || isCodeColumn(tokens[0]);
  const descriptionTokens = tokens.slice(hasCodeColumn ? 1 : 0, labStart);
  const description = descriptionTokens.join(" ").trim();
  if (!description) return null;

  return {
    description,
    laboratory,
    cantidad,
    cantidadUnidad,
    precio: precioUnitario,
    presentacion: parsePresentation(description),
    precioTotal
  };
}

function normalizeHeaderToken(token: string) {
  return token
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\/ ]+/g, " ")
    .trim();
}

function isExactTabularHeaderLine(line: string) {
  if (!line.includes("|")) return false;
  const tokens = line.split("|").map((r) => normalizeHeaderToken(r));
  const required = ["descripcion", "laboratorio", "cantidad", "valor und", "valor total"];
  const hasRequired = required.every((needle) => tokens.some((token) => token.includes(needle)));
  return hasRequired && tokens.length >= 7;
}

function parseTabularRowWithHeader(headerCols: string[], row: string) {
  const headerNorm = headerCols.map((h) => normalizeHeaderToken(h));
  const rowCols = row.includes("|")
    ? row.split("|").map((c) => c.trim())
    : splitTableColumns(row);

  const findHeaderIndex = (needle: string | string[]) => {
    const needles = Array.isArray(needle) ? needle : [needle];
    return headerNorm.findIndex((h) => needles.some((expected) => h.includes(expected)));
  };

  const descIdx = findHeaderIndex(["descripcion", "descrip"]);
  const labIdx = findHeaderIndex(["laboratorio", "lab"]);
  const cantidadIdx = findHeaderIndex(["cantidad"]);
  const valorUndIdx = findHeaderIndex(["valor und", "valorund"]);
  const valorTotalIdx = findHeaderIndex(["valor total", "valortotal"]);

  console.log("TABULAR ROW ORIGINAL", { row, rowCols, headerNorm, descIdx, labIdx, cantidadIdx, valorUndIdx, valorTotalIdx });

  if (descIdx < 0 || labIdx < 0 || cantidadIdx < 0 || valorUndIdx < 0 || valorTotalIdx < 0) {
    return null;
  }

  const description = rowCols[descIdx]?.trim();
  const laboratory = rowCols[labIdx]?.trim();
  const cantidadRaw = rowCols[cantidadIdx]?.trim();
  const valorUndRaw = rowCols[valorUndIdx]?.trim();
  const valorTotalRaw = rowCols[valorTotalIdx]?.trim();

  const cantidad = cantidadRaw ? parseNumber(cantidadRaw.replace(/[^0-9,\.]/g, "")) : undefined;
  const precioUnitario = valorUndRaw ? parseNumber(valorUndRaw.replace(/[^0-9,\.]/g, "")) : undefined;
  const precioTotal = valorTotalRaw ? parseNumber(valorTotalRaw.replace(/[^0-9,\.]/g, "")) : undefined;

  if (!description || !laboratory || !Number.isFinite(cantidad) || !Number.isFinite(precioUnitario) || !Number.isFinite(precioTotal)) {
    return null;
  }

  const item = {
    description: description.trim(),
    laboratory: laboratory.trim(),
    cantidad,
    cantidadUnidad: undefined,
    precio: precioUnitario,
    presentacion: parsePresentation(description),
    precioTotal
  };

  console.log("TABULAR ROW ITEM", item);
  return item;
}

function parseTabularLine(line: string) {
  const columns = splitTableColumns(line);
  if (line.includes("|")) {
    console.log("PARSE_TABULAR_LINE", { line, columns });
  }

  // If we got many tokens (> 8), it means splitTableColumns returned simple tokens due to single spaces
  // Try to reconstruct logical columns
  let dataCols = columns;
  if (columns.length > 8 && /^FC\d+/i.test(columns[0])) {
    const reconstructed = reconstructColumnsFromTokens(columns);
    if (reconstructed.length >= 4 && reconstructed.length <= 8) {
      dataCols = reconstructed;
    }
  }

  const parseFromColumns = (dataCols: string[]) => {
    if (dataCols.length < 4) return null as ParsedCotizacionItem | null;
    if (dataCols.some((col) => isTabularHeader(col))) return null;

    const description = dataCols[0].trim();
    const laboratory = dataCols[1].trim();
    if (!description || !laboratory) return null;

    const remaining = dataCols.slice(2).map((col) => col.trim()).filter(Boolean);
    let cantidad: number | undefined;
    let cantidadUnidad: string | undefined;
    let precioUnitario: number | undefined;
    let precioTotal: number | undefined;

    for (let i = remaining.length - 2; i >= 0; i--) {
      if (/^\d+$/.test(remaining[i]) && isUnitToken(remaining[i + 1])) {
        cantidad = parseNumber(remaining[i]);
        cantidadUnidad = remaining[i + 1];
        const pricePieces = remaining.slice(i + 2).map((value) => parseNumber(value)).filter((value) => Number.isFinite(value) && value > 0);
        if (pricePieces.length === 1) {
          precioUnitario = pricePieces[0];
        } else if (pricePieces.length >= 2) {
          precioUnitario = pricePieces[pricePieces.length - 2];
          precioTotal = pricePieces[pricePieces.length - 1];
        }
        break;
      }
    }

    if (!precioUnitario || precioUnitario === 0) {
      const pricePieces = remaining.map((value) => parseNumber(value)).filter((value) => Number.isFinite(value) && value > 0);
      if (pricePieces.length === 1) {
        precioUnitario = pricePieces[0];
      } else if (pricePieces.length >= 2) {
        precioUnitario = pricePieces[pricePieces.length - 2];
        precioTotal = pricePieces[pricePieces.length - 1];
      }
    }

    if (!precioUnitario || precioUnitario === 0) return null;

    if (cantidad !== undefined && (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad >= 1000000)) {
      cantidad = undefined;
    }

    if (cantidadUnidad && /^[0-9.,]+$/.test(cantidadUnidad)) {
      cantidadUnidad = undefined;
    }

    return {
      description,
      laboratory,
      cantidad,
      cantidadUnidad,
      precio: precioUnitario,
      presentacion: parsePresentation(description),
      precioTotal
    };
  };

  const directResult = (() => {
    let cols = dataCols;
    const hasCodeColumn = /^FC\d+/i.test(cols[0]) || isCodeColumn(cols[0]);
    if (hasCodeColumn && cols.length >= 6) {
      cols = cols.slice(1);
    }

    return parseFromColumns(cols);
  })();

  if (directResult) {
    console.log("TABULAR DETECTION", { line, columns, reconstructed: dataCols, direct: true, result: directResult });
    return directResult;
  }

  if (line.includes("|")) {
    const pipeColumns = line
      .split("|")
      .map((segment) => segment.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const pipeResult = parseFromColumns(pipeColumns);
    if (pipeResult) {
      console.log("TABULAR DETECTION PIPE", { line, columns: pipeColumns, result: pipeResult });
      return pipeResult;
    }
  }

  const heuristicResult = parseTabularLineByTokens(line);
  if (heuristicResult) {
    console.log("TABULAR DETECTION HEURISTIC", { line, columns, result: heuristicResult });
    return heuristicResult;
  }

  if (columns.length >= 4) {
    console.log("TABULAR DISCARD", { line, columns, reason: "columns parsed but no tabular match" });
  }

  return null;
}

function isAdministrativeLine(line: string) {
  const normalized = line.replace(/\s+/g, " ").trim();
  if (!normalized) return false;

  const priceInfo = extractPriceInfo(normalized);
  const explicitDollar = /\$\s*\d/.test(normalized);
  const hasValidPrice = Boolean((priceInfo && priceInfo.precio && Number.isFinite(priceInfo.precio) && priceInfo.precio > 0) || explicitDollar);

  const hasMedical = MEDICAL_TERMS_REGEX.test(normalized);
  const hasStrongProductTerm = STRONG_PRODUCT_TERMS_REGEX.test(normalized);
  const hasPresentation = Boolean(parsePresentation(normalized));
  const hasMgMl = PRESENTATION_NUMBER_REGEX.test(normalized) || /\b(?:mg|ml|gr|g)\b/i.test(normalized);
  const hasBoxLike = BOX_LIKE_REGEX.test(normalized);

  const hasAdminToken = ADMIN_LINE_REGEX.test(normalized) || IGNORE_PRICE_HEADER_REGEX.test(normalized) || HEADER_REGEX.test(normalized);
  const hasExplicitAdmin = /\b(?:nit|ruc|tel[eé]fono|tel|direcci[oó]n|subtotal|total|iva|descuento|observaciones|forma de pago|transferencia|cuenta bancaria|fecha|vendedor|pedido|notas|aprobado|p[aá]gina|cliente|ciudad|resoluci[oó]n|factura|cotizaci[oó]n|correo|whatsapp)\b/i.test(normalized);

  const scoreProduct =
    (hasValidPrice ? 5 : 0) +
    (hasMedical ? 5 : 0) +
    (hasStrongProductTerm ? 5 : 0) +
    (hasPresentation ? 3 : 0) +
    (hasMgMl ? 3 : 0) +
    (hasBoxLike ? 2 : 0);

  const scoreAdmin =
    (hasAdminToken ? 5 : 0) +
    (hasExplicitAdmin ? 5 : 0);

  const decision = scoreProduct > scoreAdmin || (hasValidPrice && hasStrongProductTerm) ? 'accept' : 'reject';
  console.log("ADMIN FILTER:", {
    linea: normalized,
    tienePrecio: hasValidPrice,
    scoreProducto: scoreProduct,
    scoreAdmin: scoreAdmin,
    decision
  });

  if (decision === 'accept') return false;
  if (!hasValidPrice && hasAdminToken) return true;

  return false;
}

function isTrashLine(line: string) {
  const normalized = line.replace(/\s+/g, " ").trim();
  if (!normalized) return true;
  if (isAdministrativeLine(normalized)) return true;
  if (HEADER_REGEX.test(normalized)) {
    const priceInfo = extractPriceInfo(normalized);
    if (!priceInfo || !priceInfo.precio) return true;
  }
  return false;
}

function isContinuationLine(line: string) {
  const normalized = line.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  if (hasPrice(normalized)) return true;
  if (CONTINUATION_MARKER_REGEX.test(normalized)) return true;
  if (PRODUCT_HINT_REGEX.test(normalized)) return true;
  if (PRESENTATION_NUMBER_REGEX.test(normalized)) return true;
  if (PRESENTATION_CONTAINER_REGEX.test(normalized)) return true;
  return false;
}

function mergeBrokenLines(lines: string[]) {
  const merged: string[] = [];
  let buffer = "";

  for (const line of lines) {
    if (isTrashLine(line)) continue;
    const cleaned = line.replace(/\s+/g, " ").trim();
    if (!cleaned) continue;

    if (!buffer) {
      buffer = cleaned;
      continue;
    }

    if (hasPrice(cleaned)) {
      buffer = `${buffer} ${cleaned}`.trim();
      merged.push(buffer);
      buffer = "";
      continue;
    }

    if (isContinuationLine(cleaned)) {
      buffer = `${buffer} ${cleaned}`.trim();
      continue;
    }

    if (hasPrice(buffer)) {
      merged.push(buffer);
      buffer = cleaned;
      continue;
    }

    // If the current buffer has no price and the next line is not recognized as continuation,
    // flush the buffer as its own line to allow the parser to decide, then start a new buffer.
    merged.push(buffer);
    buffer = cleaned;
  }

  if (buffer) {
    merged.push(buffer);
  }

  return merged;
}

export function normalizeOCRText(rawText: string) {
  return rawText
    .replace(/[\u2028\u2029\u0085]/g, "\n")
    .replace(/\r\n?/g, "\n")
    .replace(/\t+/g, "  ")  // Convert tabs to TWO spaces to preserve separation info
    .replace(/-\n/g, "")
    .replace(/ *\n+ */g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[ ]+/g, " ")   // Normalize multiple spaces to single after tab conversion
    .replace(/ *\n */g, "\n")
    .trim();
}

type OCRSplitResult = {
  rawSplitLines: string[];
  normalizedText: string;
  normalizedLines: string[];
  fallbackUsed: boolean;
};

function splitTextIntoLines(rawText: string): OCRSplitResult {
  const normalizedText = normalizeOCRText(rawText);
  const rawSplitLines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.length < 300);

  let normalizedLines = normalizedText
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0 && line.length < 300);

  let fallbackUsed = false;
  if (!normalizedLines.length) {
    fallbackUsed = true;
    normalizedLines = normalizedText
      .split(/ {2,}/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length > 0 && line.length < 300);
  }

  if (!normalizedLines.length) {
    normalizedLines = normalizedText
      .split(/(?=\$\s*\d)/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length > 0 && line.length < 300);
  }

  if (!normalizedLines.length) {
    normalizedLines = normalizedText
      .split(/(?=\b(?:ml|mg|g|vial|ampolla|gal[óo]n|caja|cj|sobre|unidad|unidades|bolsa|caja|cj)\b)/i)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length > 0 && line.length < 300);
  }

  if (!normalizedLines.length && normalizedText.length > 0) {
    normalizedLines = [normalizedText];
    fallbackUsed = true;
  }

  console.log("OCR LINE SPLIT", {
    rawLineCount: rawSplitLines.length,
    normalizedLineCount: normalizedLines.length,
    fallbackUsed,
    firstRawLines: rawSplitLines.slice(0, 10),
    firstNormalizedLines: normalizedLines.slice(0, 10)
  });

  return { rawSplitLines, normalizedText, normalizedLines, fallbackUsed };
}

export type ParserDebugResult = {
  originalLines: string[];
  normalizedLines: string[];
  mergedLines: string[];
  fallbackUsed: boolean;
  headerDetected: boolean;
  parsedLines: Array<{ line: string; item: ParsedCotizacionItem | null; rejectedReason?: string }>;
  items: ParsedCotizacionItem[];
};

export function parseDetectedItems(rawText: string) {
  const splitResult = splitTextIntoLines(rawText);
  // Prefer header/table-based parsing when possible to avoid fallback
  try {
    const debug = parseDetectedItemsWithDebug(rawText);
    if (debug.headerDetected) {
      console.log("PARSE_DETECTED_ITEMS: header detected, returning table-parsed items, count=", debug.items.length);
      return debug.items;
    }
    if (debug.items && debug.items.length) {
      console.log("PARSE_DETECTED_ITEMS: returning table-parsed items, count=", debug.items.length);
      return debug.items;
    }
  } catch (e) {
    // ignore and continue to previous behavior
    console.log("PARSE_DETECTED_ITEMS: debug parse failed", e);
  }

  const strictItems = splitResult.rawSplitLines
    .map((line) => parseLineToItem(line))
    .filter((item): item is ParsedCotizacionItem => item !== null);

  if (strictItems.length) {
    return strictItems;
  }

  const mergedLines = mergeBrokenLines(splitResult.normalizedLines);
  const fallbackItems = mergedLines
    .map((line) => parseLineToItem(line))
    .filter((item): item is ParsedCotizacionItem => item !== null);

  return fallbackItems;
}

export function parseDetectedItemsWithDebug(rawText: string): ParserDebugResult {
  const splitResult = splitTextIntoLines(rawText);
  const originalLines = splitResult.rawSplitLines;
  const normalizedLines = splitResult.normalizedLines;

  const headerLine = originalLines.find((line) => isExactTabularHeaderLine(line));
  if (headerLine) {
    const headerCols = headerLine.includes("|")
      ? headerLine.split("|").map((c) => c.trim())
      : splitTableColumns(headerLine);

    console.log("HEADER DETECTADO", {
      headerLine,
      columnasDetectadas: headerCols
    });

    const headerIndex = originalLines.indexOf(headerLine);
    const tableCandidates = [] as { line: string; parsed: ParsedCotizacionItem | null; reason?: string }[];

    for (let i = headerIndex + 1; i < originalLines.length; i++) {
      const row = originalLines[i].trim();
      if (!row) break;
      if (isAdministrativeLine(row) || isHeaderRow(row)) break;

      const parsed = parseTabularRowWithHeader(headerCols as string[], row);
      if (parsed) {
        tableCandidates.push({ line: row, parsed });
        console.log("FILA ORIGINAL", {
          row,
          columnasFila: row.includes("|") ? row.split("|").map((c) => c.trim()) : splitTableColumns(row)
        });
        console.log("OBJETO FINAL GENERADO", parsed);
      } else {
        const columns = row.includes("|") ? row.split("|").map((c) => c.trim()) : splitTableColumns(row);
        console.log("TABULAR ROW REJECTED", { line: row, columns, reason: "no exact table match" });
        tableCandidates.push({ line: row, parsed: null, reason: "no exact table match" });
      }
    }

    const successful = tableCandidates.filter((c) => c.parsed).map((c) => c.parsed as ParsedCotizacionItem);
    const items = successful.map((p) => enrichParsedItem({
      nombreOCR: p.description || "",
      nombreDetectado: p.description || "",
      presentacion: p.presentacion || undefined,
      precio: p.precio || null,
      precioCompra: p.precio || null,
      precioUnitario: p.precioUnitario || p.precio || null,
      precioTotal: p.precioTotal || p.precio || null,
      nombreComercial: undefined,
      nombreGenerico: undefined,
      concentracion: undefined,
      laboratorio: p.laboratory || undefined,
      cantidadUnidad: p.cantidadUnidad,
      cantidad: p.cantidad ?? null,
      proveedorCodigo: undefined,
      proveedor: undefined,
      fecha: undefined,
      confianza: undefined,
      estado: undefined,
      needsReview: undefined,
      revisado: undefined
    } as ParsedCotizacionItem));

    return {
      originalLines,
      normalizedLines,
      mergedLines: originalLines,
      fallbackUsed: false,
      headerDetected: true,
      parsedLines: tableCandidates.map((c) => ({ line: c.line, item: c.parsed as ParsedCotizacionItem, rejectedReason: c.reason })),
      items
    };
  }

  const strictItems = originalLines.map((line) => {
    const debug = parseLineToItemDebug(line);
    if (!debug.item && (line.includes("FC") || line.match(/\bValor Und\b/i) || line.includes("LAB"))) {
      console.log("TABULAR CANDIDATE REJECTED", {
        line,
        rejectedReason: debug.rejectedReason,
        parseTabular: parseTabularLine(line)
      });
    }
    return {
      line,
      item: debug.item,
      rejectedReason: debug.rejectedReason
    };
  });

  if (strictItems.some((entry) => entry.item)) {
    return {
      originalLines,
      normalizedLines,
      mergedLines: originalLines,
      fallbackUsed: splitResult.fallbackUsed,
      parsedLines: strictItems,
      items: strictItems.filter((entry) => entry.item).map((entry) => entry.item as ParsedCotizacionItem)
    };
  }

  const mergedLines = mergeBrokenLines(normalizedLines);
  const parsedLines = mergedLines.map((line) => {
    const debug = parseLineToItemDebug(line);
    return {
      line,
      item: debug.item,
      rejectedReason: debug.rejectedReason
    };
  });

  return {
    originalLines,
    normalizedLines,
    mergedLines,
    fallbackUsed: splitResult.fallbackUsed,
    headerDetected: false,
    parsedLines,
    items: parsedLines.filter((entry) => entry.item).map((entry) => entry.item as ParsedCotizacionItem)
  };
}

export function extractRawQuotationLines(rawText: string) {
  const normalizedText = rawText.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
  return normalizedText
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0 && line.length < 300);
}

export function extractMergedQuotationLines(rawText: string) {
  const lines = extractRawQuotationLines(rawText);
  return mergeBrokenLines(lines);
}

function hasProductHint(text: string) {
  return PRODUCT_HINT_REGEX.test(text);
}

function isProbableProductLine(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return false;

  // Rechazo inmediato: palabra prohibida encontrada
  if (hasProhibitedKeyword(normalized)) return false;

  // Rechazo: solo números (códigos)
  if (normalized.match(/^[\d\-\/\s]+$/)) return false;

  // Rechazo: muy corta sin contenido de palabra
  if (normalized.length < 10 && !normalized.match(/[a-záéíóúü]{3,}/i)) return false;

  // Aceptación: tiene indicador fuerte de producto
  if (hasProductHint(normalized)) return true;
  if (parsePresentation(normalized)) return true;
  if (parseLaboratory(normalized)) return true;

  // Fallback: necesita al menos 2 palabras alfabéticas
  const words = normalized.split(/\s+/).filter((token) => /^[A-Za-zÀ-ÿ]{3,}$/.test(token));
  return words.length >= 2;
}

function parseLineToItemDebug(line: string): { item: ParsedCotizacionItem | null; rejectedReason?: string } {
  const cleanedLine = line.trim();
  if (!cleanedLine) return { item: null, rejectedReason: "rechazado: línea vacía" };

  const tabular = parseTabularLine(cleanedLine);
  if (tabular) {
    const item: ParsedCotizacionItem = enrichParsedItem({
      nombreOCR: cleanedLine,
      nombreDetectado: tabular.description,
      presentacion: tabular.presentacion || undefined,
      precio: tabular.precio,
      precioCompra: tabular.precio,
      precioUnitario: tabular.precioUnitario ?? tabular.precio,
      precioTotal: tabular.precioTotal ?? tabular.precio,
      nombreComercial: undefined,
      nombreGenerico: undefined,
      concentracion: undefined,
      laboratorio: tabular.laboratory || undefined,
      cantidadUnidad: tabular.cantidadUnidad,
      cantidad: tabular.cantidad ?? null,
      proveedorCodigo: undefined,
      proveedor: undefined,
      fecha: undefined,
      confianza: undefined,
      estado: undefined,
      needsReview: undefined,
      revisado: undefined
    });

    return { item };
  }

  const priceInfo = extractPriceInfo(cleanedLine);
  if (!priceInfo?.precio) {
    return { item: null, rejectedReason: "rechazado: sin precio válido" };
  }

  const precioValue = priceInfo.precio;
  const beforePrice = cleanedLine.slice(0, priceInfo.index).trim();
  const afterPrice = cleanedLine.slice(priceInfo.index + priceInfo.raw.length).trim();
  let productText = `${beforePrice} ${afterPrice}`.trim();

  // Remover precios
  productText = productText.replace(/\$\s*[0-9\.,]+/g, " ").trim();

  // Limpiar con la nueva función
  productText = cleanProductName(productText);

  // Remover códigos técnicos
  productText = removeTechnicalCodes(productText);

  // Remover parentésis
  productText = productText.replace(/\([^)]*\)/g, " ");

  // Remover palabras clave administrativas
  productText = productText.replace(/\b(?:UNIDAD|UND|CAJA|ITEM|REF|REFERENCIA|CÓDIGO|CODIGO|SKU|IQM|FC|FCO|MD|SE|SC|LABORATORIO|LAB\.|PROVEEDOR|DISTRIBUIDOR|NIT|RUC)\b/gi, " ");

  // Limpiar cantidades y medidas residuales
  productText = productText.replace(/\b(?:ML|MG|G|L|CC|UI|UI\/ML|ML\/KG|CAJA|BOLSA|PACK|PAQ|FCO)\b/gi, " ");

  // Remover números de 3+ dígitos (códigos de inventario)
  productText = productText.replace(/\b\d{3,}\b/g, " ");

  // Normalizar espacios
  productText = productText.replace(/\s+/g, " ").trim();

  if (!productText || productText.length < 3) {
    return { item: null, rejectedReason: "rechazado: texto de producto insuficiente" };
  }

  if (isSpelledOut(productText)) {
    return { item: null, rejectedReason: "rechazado: texto con letras separadas" };
  }

  // Extraer presentación y cantidad
  const presentacion = parsePresentation(productText);
  const cantidad = parseQuantity(productText) ?? parseQuantity(rawBeforePrice) ?? null;
  let nombreTexto = productText;
  if (presentacion) {
    nombreTexto = nombreTexto.replace(new RegExp(escapeRegExp(presentacion), "gi"), " ").trim();
  }

  // Normalizar guiones
  nombreTexto = nombreTexto.replace(/[-_]+/g, " ");

  // Extraer nombres y genéricos
  const parsedNames = parseProductNames(nombreTexto);
  let nombreDetectado = parsedNames.cleanedName || nombreTexto;
  let nombreGenerico = parsedNames.nombreGenerico;

  nombreTexto = nombreTexto
    .replace(/\b\d+\b(?![%mgmll])/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!nombreTexto || nombreTexto.length < 3) {
    return { item: null, rejectedReason: "rechazado: no se detectó nombre válido" };
  }

  nombreDetectado = nombreDetectado.replace(/\s+/g, " ").trim();

  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ%]/.test(nombreDetectado)) {
    return { item: null, rejectedReason: "rechazado: nombre no válido" };
  }

  const { precioUnitario, precioTotal } = derivePriceBreakdown(cleanedLine, cantidad);
  const finalPrecioUnitario = precioUnitario ?? precioValue;
  const finalPrecioTotal = precioTotal ?? precioValue;

  const item: ParsedCotizacionItem = enrichParsedItem({
    nombreOCR: cleanedLine,
    nombreDetectado,
    presentacion: presentacion || undefined,
    precio: finalPrecioUnitario,
    precioCompra: finalPrecioUnitario,
    precioUnitario: finalPrecioUnitario,
    precioTotal: precioTotal ?? finalPrecioTotal,
    nombreComercial: undefined,
    nombreGenerico,
    concentracion: undefined,
    laboratorio: parseLaboratory(productText) || undefined,
    cantidadUnidad: undefined,
    cantidad,
    proveedorCodigo: undefined,
    proveedor: undefined,
    fecha: undefined,
    confianza: undefined,
    estado: undefined,
    needsReview: undefined,
    revisado: undefined
  });

  return { item };
}

function parseLineToItem(line: string): ParsedCotizacionItem | null {
  return parseLineToItemDebug(line).item;
}

export function findProductMatch(name: string, products: Array<{ id: string; nombre: string }>) {
  const canonicalName = canonicalizeProductName(name);
  if (!canonicalName) return null;

  const candidates = products.map((product) => ({
    id: product.id,
    nombre: product.nombre,
    canonical: canonicalizeProductName(product.nombre)
  }));

  const exact = candidates.find((product) => product.canonical === canonicalName);
  if (exact) return { id: exact.id, matchedProductName: exact.nombre };

  const contains = candidates.find((product) => product.canonical.includes(canonicalName) || canonicalName.includes(product.canonical));
  if (contains) return { id: contains.id, matchedProductName: contains.nombre };

  const tokens = canonicalName.split(" ").filter((token) => token.length >= 3);
  let best: { id: string; matchedProductName: string; score: number } | null = null;
  for (const product of candidates) {
    const commonTokens = tokens.filter((token) => product.canonical.includes(token)).length;
    if (commonTokens > 0 && commonTokens > (best?.score ?? 0)) {
      best = { id: product.id, matchedProductName: product.nombre, score: commonTokens };
    }
  }

  if (best) return { id: best.id, matchedProductName: best.matchedProductName };

  let top: { id: string; matchedProductName: string; score: number } | null = null;
  for (const product of candidates) {
    const score = fuzzySimilarity(canonicalName, product.canonical);
    if (!top || score > top.score) {
      top = { id: product.id, matchedProductName: product.nombre, score };
    }
  }

  if (top && top.score >= 0.45) {
    return { id: top.id, matchedProductName: top.matchedProductName };
  }

  return null;
}

function fuzzySimilarity(a: string, b: string) {
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - distance / maxLen;
}

function levenshteinDistance(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

export function compareProviderPrices(cotizaciones: Array<any>) {
  const groups = new Map<string, Array<{ provider: string; price: number; product: string; presentation: string }>>();

  cotizaciones.forEach((cotizacion) => {
    cotizacion.items.forEach((item: any) => {
      const name = item.producto?.nombre || item.nombreDetectado || item.nombreOcr || "";
      const canonical = canonicalizeProductName(name);
      if (!canonical) return;
      const presentation = normalizeProductName(item.presentacion || "");
      const key = `${canonical}|${presentation}`;
      const list = groups.get(key) ?? [];
      list.push({ provider: cotizacion.proveedor.nombre, price: Number(item.precio), product: item.producto?.nombre || item.nombreDetectado || item.nombreOcr, presentation });
      groups.set(key, list);
    });
  });

  return Array.from(groups.values())
    .filter((items) => items.length >= 2)
    .map((items) => {
      const sorted = [...items].sort((a, b) => a.price - b.price);
      return {
        product: sorted[0].product,
        presentation: sorted[0].presentation,
        bestProvider: sorted[0].provider,
        bestPrice: sorted[0].price,
        secondPrice: sorted[1].price,
        savings: sorted[1].price - sorted[0].price
      };
    })
    .sort((a, b) => b.savings - a.savings);
}
