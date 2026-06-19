"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProductName = normalizeProductName;
exports.canonicalizeProductName = canonicalizeProductName;
exports.extractPrecioSeguro = extractPrecioSeguro;
exports.normalizeOCRText = normalizeOCRText;
exports.parseDetectedItems = parseDetectedItems;
exports.parseDetectedItemsWithDebug = parseDetectedItemsWithDebug;
exports.extractRawQuotationLines = extractRawQuotationLines;
exports.extractMergedQuotationLines = extractMergedQuotationLines;
exports.findProductMatch = findProductMatch;
exports.compareProviderPrices = compareProviderPrices;
const HEADER_REGEX = /\b(NIT|RUC|FECHA|VENDEDOR|CIUDAD|DIRECCI[ÓO]N|TEL(?:[ÉE]FONO)?|BODEGA|NOTA|NOTAS|SUBTOTAL|TOTAL|IVA|P[AÁ]GINA|CLIENTE|COTIZACI[ÓO]N|CONDICIONES|FORMA DE PAGO|PLAZO|PEDIDO|REFERENCIA|OBSERVACIONES|CANTIDAD|CANT|COD(?:IGO)?|CÓDIGO|FACTURA|FACTURACI[ÓO]N|MONTO|SALDO|PAGADO|CONCEPTO|SERIE|DOCUMENTO)\b/i;
const IGNORE_PRICE_HEADER_REGEX = /\b(TOTAL|SUBTOTAL|IVA|DESCUENTO|NETO|IMPORTE|GRAVADO|PAGO|INTERES|SEGURO|RETENCI[ÓO]N|M[ÓO]VIL|DEBITO|CREDITO)\b/i;
const ADMIN_LINE_REGEX = /\b(?:factura|nit|ruc|cliente|vendedor|direcci[óo]n|tel[eé]fono|email|subtotal|total|iva|descuento|neto|importe|gravado|pago|interes|seguro|retencion|observaciones|nota|referencia|pedido|cotizaci[óo]n|forma de pago|plazo|condiciones|p[aá]gina|serie|documento|monto|saldo|pagado|caja|cajero|facturaci[óo]n|fecha de emision)\b/i;
const CODE_REGEX = /\b(?:C(?:O|Ó)D(?:IGO)?|REF|COD|NIT|RUC)[:\-]?\s*([A-Z0-9\-\/]+)\b/i;
const LAB_MARKER_REGEX = /\b(osa|mk|bayer|pfizer|merck|lilly|novo|roche|sandoz|tecnoquímicas|procaps|provet|lavet|syntec|andrómaco|clorvet|vetoquinol|zoetis|biogénesis|biogenesis|arroyo|norstray)\b/i;
const LAB_PREFIX_REGEX = /\b(?:LAB(?:ORATORIO)?|LAB\.)\s+[A-Z][A-Z0-9]*(?:\s+[A-Z][A-Z0-9]*)*\b/i;
const PRODUCT_HINT_REGEX = /\b(agua esteril|agua oxigenada|dipirona|alcohol|ampidet|ampicilina|sulbactam|norstray|osa|mk|bayer|pfizer|merck|lilly|novo|roche|sandoz|tecnoquímicas|procaps|provet|lavet|syntec|andrómaco|clorvet|vetoquinol|zoetis|biogénesis|biogenesis|meloxicam|carprofeno|enrofloxacina|amoxicilina|cefalexina|cefalexin|gentamicina|cefazolina|ivermectina|itraconazol|tableta|caja|bolsa|vial|frasco|ampolla|gal[óo]n)\b/i;
const TABULAR_HEADER_REGEX = /\b(?:c[oó]digo|descripci[oó]n|laboratorio|lote|cantidad|u\/?m|valor\s*und|valor\s*total|iva|subtotal|total)\b/i;
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
function normalizeProductName(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[+&\/\-]/g, " + ")
        .replace(/[^a-z0-9\s+]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function canonicalizeProductName(value) {
    const normalized = normalizeProductName(value);
    if (!normalized)
        return "";
    const ALIAS_CANONICAL = {
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
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function parseNumber(value) {
    const cleaned = value.replace(/\$/g, "").replace(/\./g, "").replace(/,/g, ".");
    return Number(cleaned);
}
const PRICE_CONTEXT_EXCLUDE_REGEX = /\b(?:lot(?:e)?|ref(?:erencia)?|fc|d\d{2}|h\d{2}|n\d{2}|cod(?:igo)?|cód(?:igo)?|ean|gtin|barcode|barra|serie|nro|num|no|lote|sku|internal|interno)\b/i;
function isPriceCandidate(text, match) {
    var _a;
    const index = (_a = match.index) !== null && _a !== void 0 ? _a : 0;
    const candidate = match[0];
    const before = text.slice(Math.max(0, index - 24), index).toLowerCase();
    const after = text.slice(index + candidate.length, index + candidate.length + 24).toLowerCase();
    // If the overall line contains medical terms, prefer the candidate (don’t aggressively exclude)
    if (MEDICAL_TERMS_REGEX.test(text))
        return true;
    // Don't exclude price-like tokens if the line contains medical terms (whitelist)
    const hasMedical = MEDICAL_TERMS_REGEX.test(text);
    if (!hasMedical && PRICE_EXCLUDE_CONTEXT_REGEX.test(`${before} ${after}`))
        return false;
    if (!hasMedical && PRICE_CONTEXT_EXCLUDE_REGEX.test(`${before} ${after}`))
        return false;
    const digits = candidate.replace(/[^0-9]/g, "");
    if (!candidate.startsWith("$") && digits.length >= 7 && !candidate.includes(",") && !candidate.includes(".")) {
        return false;
    }
    if (/\b\d{7,13}\b/.test(candidate) && !candidate.includes("$") && !candidate.includes(",") && !candidate.includes(".")) {
        return false;
    }
    return true;
}
function hasPrice(text) {
    return PRICE_REGEX.test(text);
}
function scorePriceCandidate(candidate, textLength, isLastCandidate) {
    if (!candidate.valid)
        return -Infinity;
    let score = 0;
    if (/^\$/.test(candidate.raw))
        score += 40;
    if (candidate.raw.includes(",") || candidate.raw.includes("."))
        score += 20;
    if (/^\$?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(candidate.raw))
        score += 20;
    if (/^\$?\d+(?:,\d{2})?$/.test(candidate.raw))
        score += 10;
    if (candidate.parsed >= 10000000)
        score -= 50;
    if (candidate.parsed >= 1000000 && !candidate.raw.includes("$") && !candidate.raw.includes(",") && !candidate.raw.includes("."))
        score -= 25;
    if (candidate.parsed < 500)
        score -= 20;
    const relativePosition = candidate.index / Math.max(1, textLength);
    score += Math.round(relativePosition * 12);
    if (isLastCandidate)
        score += 20;
    return score;
}
function extractPriceInfo(text) {
    PRICE_GLOBAL_REGEX.lastIndex = 0;
    const matches = Array.from(text.matchAll(PRICE_GLOBAL_REGEX));
    if (!matches.length)
        return undefined;
    const candidates = matches
        .map((match) => {
        var _a;
        return ({
            raw: match[0],
            index: (_a = match.index) !== null && _a !== void 0 ? _a : 0,
            parsed: parseNumber(match[0]),
            valid: isPriceCandidate(text, match)
        });
    })
        .filter((candidate) => candidate.valid && Number.isFinite(candidate.parsed) && candidate.parsed > 0);
    if (!candidates.length)
        return undefined;
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
function extractPrice(text) {
    var _a;
    return (_a = extractPriceInfo(text)) === null || _a === void 0 ? void 0 : _a.precio;
}
function extractPrecioSeguro(text) {
    return extractPrice(text);
}
function parsePresentation(text) {
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
function parseQuantity(text) {
    const match = text.match(QUANTITY_REGEX);
    if (!match)
        return undefined;
    const value = match[1] || match[2];
    const quantity = Number(value);
    return Number.isFinite(quantity) && quantity > 0 ? quantity : undefined;
}
function parseLaboratory(text) {
    const prefixMatch = text.match(LAB_PREFIX_REGEX);
    if (prefixMatch)
        return prefixMatch[0].trim();
    const match = text.match(LAB_MARKER_REGEX);
    if (match)
        return match[1].trim();
    const tokens = text.split(/\s+/).filter((token) => /^[A-Z]{2,5}$/.test(token));
    return tokens.length === 1 ? tokens[0] : undefined;
}
function removeTechnicalCodes(text) {
    return text
        .replace(/\b(?:FC|D\d{2}|H\d{2}|N\d{2}|LOTE|LOT|REF(?:ERENCIA)?|COD(?:IGO)?|CÓDIGO|EAN|GTIN|BARCODE|BARRA|SERIE|NRO|NUM|NO)\b[:\-]?\s*[A-Z0-9-\/]+/gi, " ")
        .replace(/\b(?:FC|D\d{2}|H\d{2}|N\d{2})\b/gi, " ")
        .replace(/\b\d{7,13}\b/g, " ")
        .replace(/\b[A-Z0-9]{2,4}\d{2,6}\b/g, " ")
        .replace(/\b(?:UND|UND\.|UN|U\.N\.|CJX|CJ|CAJA|BOLSA|PACK|PAQ|PK)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function parseProductNames(text) {
    let cleaned = removeTechnicalCodes(text.replace(CODE_REGEX, " ")).trim();
    let generic;
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
function splitTableColumns(line) {
    return line
        .replace(/\t/g, "  ")
        .replace(/\|/g, "  ")
        .split(/ {2,}/)
        .map((segment) => segment.replace(/\s+/g, " ").trim())
        .filter(Boolean);
}
function isUnitToken(value) {
    return typeof value === "string" && /^(?:u[ni]d|unidad(?:es)?|viales?|tabletas?|comprimidos?|capsulas?|caps|tab|tabs|caja|bolsa|pack|paquete|cj|cjx|ml|mg|g|l|cc)/i.test(value.trim());
}
function isCodeColumn(text) {
    const cleaned = text.trim();
    return /^[A-Z0-9\-\/]{2,20}$/.test(cleaned) && !/[a-záéíóúü]/i.test(cleaned);
}
function isTabularHeader(text) {
    return /^(?:c[oó]digo|descripci[oó]n|laboratorio|lote|cantidad|u\/?m|valor\s*und|iva|valor\s*total|unidad|precio)$/i.test(text.trim());
}
function parseTabularLine(line) {
    var _a, _b, _c, _d, _e;
    const columns = splitTableColumns(line);
    if (line.includes('|')) {
        console.log('PARSE_TABULAR_LINE', { line, columns });
    }
    if (columns.length < 5)
        return null;
    let dataCols = columns;
    if (isCodeColumn(dataCols[0]) && dataCols.length >= 6) {
        dataCols = dataCols.slice(1);
    }
    if (dataCols.length < 5)
        return null;
    if (isTabularHeader(dataCols[0]))
        return null;
    const description = dataCols[0].trim();
    const laboratory = (_a = dataCols[1]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!description || !laboratory)
        return null;
    let cantidad;
    let cantidadUnidad;
    let precio;
    if (dataCols.length === 5) {
        cantidad = parseNumber(dataCols[2]);
        cantidadUnidad = (_b = dataCols[3]) === null || _b === void 0 ? void 0 : _b.trim();
        precio = parseNumber(dataCols[4]);
    }
    else if (dataCols.length === 6) {
        if (isUnitToken(dataCols[4])) {
            cantidad = parseNumber(dataCols[3]);
            cantidadUnidad = (_c = dataCols[4]) === null || _c === void 0 ? void 0 : _c.trim();
            precio = parseNumber(dataCols[5]);
        }
        else {
            cantidad = parseNumber(dataCols[2]);
            cantidadUnidad = (_d = dataCols[3]) === null || _d === void 0 ? void 0 : _d.trim();
            precio = parseNumber(dataCols[5]);
        }
    }
    else {
        const quantityIndex = dataCols.length - 5;
        const unitIndex = dataCols.length - 4;
        const valorUndIndex = dataCols.length - 3;
        cantidad = parseNumber(dataCols[quantityIndex]);
        cantidadUnidad = (_e = dataCols[unitIndex]) === null || _e === void 0 ? void 0 : _e.trim();
        precio = parseNumber(dataCols[valorUndIndex]);
    }
    if (!precio || precio === 0)
        return null;
    if (cantidad !== undefined && (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad >= 1000000)) {
        cantidad = undefined;
    }
    if (cantidadUnidad && /^[0-9.,]+$/.test(cantidadUnidad)) {
        cantidadUnidad = undefined;
    }
    const presentacion = parsePresentation(description);
    return {
        description,
        laboratory,
        cantidad,
        cantidadUnidad,
        precio,
        presentacion
    };
}
function isAdministrativeLine(line) {
    const normalized = line.replace(/\s+/g, " ").trim();
    if (!normalized)
        return false;
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
    const scoreProduct = (hasValidPrice ? 5 : 0) +
        (hasMedical ? 5 : 0) +
        (hasStrongProductTerm ? 5 : 0) +
        (hasPresentation ? 3 : 0) +
        (hasMgMl ? 3 : 0) +
        (hasBoxLike ? 2 : 0);
    const scoreAdmin = (hasAdminToken ? 5 : 0) +
        (hasExplicitAdmin ? 5 : 0);
    const decision = scoreProduct > scoreAdmin || (hasValidPrice && hasStrongProductTerm) ? 'accept' : 'reject';
    console.log("ADMIN FILTER:", {
        linea: normalized,
        tienePrecio: hasValidPrice,
        scoreProducto: scoreProduct,
        scoreAdmin: scoreAdmin,
        decision
    });
    if (decision === 'accept')
        return false;
    if (!hasValidPrice && hasAdminToken)
        return true;
    return false;
}
function isTrashLine(line) {
    const normalized = line.replace(/\s+/g, " ").trim();
    if (!normalized)
        return true;
    if (isAdministrativeLine(normalized))
        return true;
    if (HEADER_REGEX.test(normalized)) {
        const priceInfo = extractPriceInfo(normalized);
        if (!priceInfo || !priceInfo.precio)
            return true;
    }
    return false;
}
function isContinuationLine(line) {
    const normalized = line.replace(/\s+/g, " ").trim();
    if (!normalized)
        return false;
    if (hasPrice(normalized))
        return true;
    if (CONTINUATION_MARKER_REGEX.test(normalized))
        return true;
    if (PRODUCT_HINT_REGEX.test(normalized))
        return true;
    if (PRESENTATION_NUMBER_REGEX.test(normalized))
        return true;
    if (PRESENTATION_CONTAINER_REGEX.test(normalized))
        return true;
    return false;
}
function mergeBrokenLines(lines) {
    const merged = [];
    let buffer = "";
    for (const line of lines) {
        if (isTrashLine(line))
            continue;
        const cleaned = line.replace(/\s+/g, " ").trim();
        if (!cleaned)
            continue;
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
function normalizeOCRText(rawText) {
    return rawText
        .replace(/[\u2028\u2029\u0085]/g, "\n")
        .replace(/\r\n?/g, "\n")
        .replace(/\t+/g, " ")
        .replace(/-\n/g, "")
        .replace(/ *\n+ */g, "\n")
        .replace(/\u00A0/g, " ")
        .replace(/[ ]+/g, " ")
        .replace(/ *\n */g, "\n")
        .trim();
}
function splitTextIntoLines(rawText) {
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
    return { rawSplitLines, normalizedText, normalizedLines, fallbackUsed };
}
function parseDetectedItems(rawText) {
    const splitResult = splitTextIntoLines(rawText);
    const strictItems = splitResult.rawSplitLines
        .map((line) => parseLineToItem(line))
        .filter((item) => item !== null);
    if (strictItems.length) {
        return strictItems;
    }
    const mergedLines = mergeBrokenLines(splitResult.normalizedLines);
    const fallbackItems = mergedLines
        .map((line) => parseLineToItem(line))
        .filter((item) => item !== null);
    return fallbackItems;
}
function parseDetectedItemsWithDebug(rawText) {
    const splitResult = splitTextIntoLines(rawText);
    const originalLines = splitResult.rawSplitLines;
    const normalizedLines = splitResult.normalizedLines;

    // Try header/table-aware parsing first
    const headerLine = originalLines.find((line) => TABULAR_HEADER_REGEX.test(line));
    if (headerLine) {
        console.log("TABULAR HEADER DETECTED", {
            headerLine,
            columns: splitTableColumns(headerLine)
        });

        const headerIndex = originalLines.indexOf(headerLine);
        const headerCols = headerLine.includes("|") ? headerLine.split("|").map((c) => c.trim()) : splitTableColumns(headerLine);
        const tableCandidates = [];

        for (let i = headerIndex + 1; i < originalLines.length; i++) {
            const row = originalLines[i].trim();
            if (!row) break;
            if (isAdministrativeLine(row) || isTabularHeader(row)) break;

            // map row columns by header indices
            const columns = row.includes("|") ? row.split("|").map((c) => c.trim()) : splitTableColumns(row);
            const headerNorm = headerCols.map((h) => (h || "").replace(/\s+/g, " ").trim().toLowerCase());

            const findIndex = (pred) => headerNorm.findIndex(pred);
            const descIdx = findIndex((h) => h.includes("descrip") || h.includes("description"));
            const labIdx = findIndex((h) => h.includes("laborat") || h.includes("lab"));
            const cantidadIdx = findIndex((h) => h.includes("cantidad") || h.includes("cant"));
            const umIdx = findIndex((h) => h.includes("u/m") || h.includes("u m") || h === "u/m" || h.includes("unidad"));
            const valorUndIdx = findIndex((h) => (h.includes("valor") && h.includes("und")) || h.includes("valor und") || (h.includes("valor") && h.includes("unidad")));
            const valorTotalIdx = findIndex((h) => h.includes("valor total") || (h.includes("valor") && h.includes("total")) || h.includes("total"));

            const safe = (idx) => (idx >= 0 && idx < columns.length ? columns[idx] : undefined);
            const description = safe(descIdx) || safe(1) || columns[0];
            const laboratory = safe(labIdx) || safe(2) || columns[1];
            const cantidadRaw = safe(cantidadIdx) || undefined;
            const unidadRaw = safe(umIdx) || undefined;
            const valorUndRaw = safe(valorUndIdx) || undefined;
            const valorTotalRaw = safe(valorTotalIdx) || undefined;

            const cantidad = cantidadRaw ? parseNumber((cantidadRaw || "").replace(/[^0-9,\.]/g, "")) : undefined;
            const cantidadUnidad = unidadRaw ? unidadRaw.trim() : undefined;
            const precioUnitario = valorUndRaw ? parseNumber((valorUndRaw || "").replace(/[^0-9,\.]/g, "")) : undefined;
            const precioTotal = valorTotalRaw ? parseNumber((valorTotalRaw || "").replace(/[^0-9,\.]/g, "")) : undefined;

            if (description && laboratory && (precioUnitario || precioTotal)) {
                const parsed = {
                    description: (description || "").trim(),
                    laboratory: laboratory ? laboratory.trim() : undefined,
                    cantidad,
                    cantidadUnidad,
                    precio: precioUnitario || precioTotal,
                    presentacion: parsePresentation(description),
                    precioTotal
                };
                console.log("TABULAR ROW PARSED", { line: row, parsed });
                tableCandidates.push({ line: row, parsed });
            }
            else {
                console.log("TABULAR ROW REJECTED", { line: row, columns, reason: "no tabular match" });
                tableCandidates.push({ line: row, parsed: null, reason: "no tabular match" });
            }
        }

        const successful = tableCandidates.filter((c) => c.parsed).map((c) => c.parsed);
        if (successful.length) {
            const items = successful.map((p) => ({
                nombreOCR: p.description || "",
                nombreDetectado: p.description || "",
                presentacion: p.presentacion || undefined,
                precio: p.precio || null,
                precioCompra: p.precio || null,
                precioUnitario: p.precio || null,
                precioTotal: p.precioTotal || null,
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
            }));

            return {
                originalLines,
                normalizedLines,
                mergedLines: originalLines,
                fallbackUsed: false,
                parsedLines: tableCandidates.map((c) => ({ line: c.line, item: c.parsed, rejectedReason: c.reason })),
                items
            };
        }
    }

    // Fallback to previous strict parsing behavior
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
            items: strictItems.filter((entry) => entry.item).map((entry) => entry.item)
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
        parsedLines,
        items: parsedLines.filter((entry) => entry.item).map((entry) => entry.item)
    };
}
function extractRawQuotationLines(rawText) {
    const normalizedText = rawText.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
    return normalizedText
        .split(/\n+/)
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line.length > 0 && line.length < 300);
}
function extractMergedQuotationLines(rawText) {
    const lines = extractRawQuotationLines(rawText);
    return mergeBrokenLines(lines);
}
function hasProductHint(text) {
    return PRODUCT_HINT_REGEX.test(text);
}
function isProbableProductLine(text) {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized)
        return false;
    if (hasProductHint(normalized))
        return true;
    if (parsePresentation(normalized))
        return true;
    if (parseLaboratory(normalized))
        return true;
    const words = normalized.split(/\s+/).filter((token) => /^[A-Za-zÀ-ÿ]{3,}$/.test(token));
    return words.length >= 2;
}
function parseLineToItemDebug(line) {
    var _a, _b, _c;
    const cleanedLine = line.trim();
    if (isTrashLine(cleanedLine))
        return { item: null, rejectedReason: "rechazado: línea administrativa" };
    const tabular = parseTabularLine(line);
    console.log('DEBUG parseLineToItemDebug tabular', { line, tabular });
    let precioValue;
    let description;
    let laboratory;
    let quantity;
    let quantityUnit;
    let presentacion;
    let nombreDetectado;
    let nombreGenerico;
    if (tabular) {
        precioValue = tabular.precio;
        description = tabular.description;
        laboratory = tabular.laboratory;
        quantity = tabular.cantidad;
        quantityUnit = tabular.cantidadUnidad;
        presentacion = tabular.presentacion;
        nombreDetectado = description;
        const item = {
            nombreOCR: cleanedLine,
            nombreDetectado,
            nombreComercial: description,
            nombreGenerico: undefined,
            presentacion,
            concentracion: presentacion,
            laboratorio: laboratory,
            cantidadUnidad: quantityUnit !== null && quantityUnit !== void 0 ? quantityUnit : (quantity ? String(quantity) : undefined),
            cantidad: quantity !== null && quantity !== void 0 ? quantity : null,
            precio: precioValue,
            precioCompra: precioValue,
            precioUnitario: precioValue,
            precioTotal: precioValue,
            proveedorCodigo: undefined,
            needsReview: false,
            revisado: false,
            confianza: 100,
            estado: "OK"
        };
        return { item };
    }
    if (!precioValue) {
        const priceInfo = extractPriceInfo(cleanedLine);
        let usedPriceInfo = priceInfo;
        if (!priceInfo || !priceInfo.precio) {
            // Fallback: if there's an explicit $ followed by digits, use it as price
            const dollarMatch = cleanedLine.match(/\$\s*[0-9\.,]+/);
            if (dollarMatch) {
                precioValue = parseNumber(dollarMatch[0]);
                usedPriceInfo = { raw: dollarMatch[0], index: cleanedLine.indexOf(dollarMatch[0]), parsed: precioValue, precio: precioValue };
            }
            else {
                return { item: null, rejectedReason: "rechazado: no encontró precio" };
            }
        }
        else {
            precioValue = priceInfo.precio;
        }
        const before = cleanedLine.slice(0, usedPriceInfo.index).trim();
        const after = cleanedLine.slice(usedPriceInfo.index + ((_b = (_a = usedPriceInfo.raw) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0)).trim();
        let rawBeforePrice = `${before} ${after}`.trim();
        rawBeforePrice = rawBeforePrice.replace(/\$\s*[0-9\.,]+/g, " ").replace(/\b\d{7,13}\b/g, " ").replace(/\s+/g, " ").trim();
        if (!isProbableProductLine(rawBeforePrice))
            return { item: null, rejectedReason: "rechazado: patrón inválido" };
        const productText = removeTechnicalCodes(rawBeforePrice);
        presentacion = presentacion || parsePresentation(productText);
        quantity = (_c = quantity !== null && quantity !== void 0 ? quantity : parseQuantity(productText)) !== null && _c !== void 0 ? _c : parseQuantity(rawBeforePrice);
        laboratory = laboratory || parseLaboratory(productText);
        const parsedNames = parseProductNames(productText);
        nombreDetectado = parsedNames.cleanedName;
        nombreGenerico = parsedNames.nombreGenerico;
    }
    if (!nombreDetectado && description) {
        nombreDetectado = description;
    }
    if (!nombreDetectado) {
        nombreDetectado = cleanedLine;
    }
    if (!nombreGenerico) {
        const parsedNames = parseProductNames(nombreDetectado);
        nombreGenerico = parsedNames.nombreGenerico;
    }
    const cleanedDescription = nombreDetectado
        .replace(CODE_REGEX, " ")
        .replace(/\b(?:sp\.|usp|u\.s\.p)\b/gi, " ")
        .replace(/\$\s*[0-9\.,]+/g, " ")
        .replace(/\b(?:FC|D\d{2}|H\d{2}|N\d{2}|LOTE|LOT|REF(?:ERENCIA)?|COD|CÓDIGO|EAN|GTIN|BARCODE|BARRA|SERIE|NRO|NUM|NO)\b[:\-]?\s*[^\s]+/gi, " ")
        .replace(/\b(?:FC|D\d{2}|H\d{2}|N\d{2})\b/gi, " ")
        .replace(new RegExp(escapeRegExp(laboratory || ""), "gi"), " ")
        .replace(/^\d+(?!\s*(?:mg|mcg|g|kg|ml|cc|l|ui|ui\/ml|ml\/kg|bolsa|vial|frasco|ampolla|caja|pack|paquete))\b\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
    nombreDetectado = cleanedDescription || nombreDetectado;
    if (!nombreDetectado || nombreDetectado.length < 2) {
        nombreDetectado = description || nombreGenerico || cleanedLine;
    }
    nombreDetectado = nombreDetectado.replace(/\s+/g, " ").trim();
    const confianza = Math.min(100, Math.max(20, Number(Boolean(precioValue)) * 30 +
        Number(Boolean(presentacion)) * 25 +
        Number(Boolean(nombreDetectado)) * 25 +
        Number(Boolean(laboratory)) * 10 +
        Number(Boolean(quantity)) * 10));
    const estado = confianza < 70 ? "revisar manualmente" : "OK";
    const precioUnitario = precioValue && quantity ? Math.round((precioValue / quantity) * 100) / 100 : precioValue;
    const item = {
        nombreOCR: cleanedLine,
        nombreDetectado,
        nombreComercial: description,
        nombreGenerico,
        presentacion,
        concentracion: presentacion,
        laboratorio: laboratory,
        cantidadUnidad: quantityUnit !== null && quantityUnit !== void 0 ? quantityUnit : (quantity ? String(quantity) : undefined),
        cantidad: quantity !== null && quantity !== void 0 ? quantity : null,
        precio: precioValue,
        precioCompra: precioValue,
        precioUnitario,
        precioTotal: precioValue,
        proveedorCodigo: undefined,
        needsReview: estado === "revisar manualmente",
        revisado: false,
        confianza,
        estado
    };
    return { item };
}
function parseLineToItem(line) {
    return parseLineToItemDebug(line).item;
}
function findProductMatch(name, products) {
    var _a;
    const canonicalName = canonicalizeProductName(name);
    if (!canonicalName)
        return null;
    const candidates = products.map((product) => ({
        id: product.id,
        nombre: product.nombre,
        canonical: canonicalizeProductName(product.nombre)
    }));
    const exact = candidates.find((product) => product.canonical === canonicalName);
    if (exact)
        return { id: exact.id, matchedProductName: exact.nombre };
    const contains = candidates.find((product) => product.canonical.includes(canonicalName) || canonicalName.includes(product.canonical));
    if (contains)
        return { id: contains.id, matchedProductName: contains.nombre };
    const tokens = canonicalName.split(" ").filter((token) => token.length >= 3);
    let best = null;
    for (const product of candidates) {
        const commonTokens = tokens.filter((token) => product.canonical.includes(token)).length;
        if (commonTokens > 0 && commonTokens > ((_a = best === null || best === void 0 ? void 0 : best.score) !== null && _a !== void 0 ? _a : 0)) {
            best = { id: product.id, matchedProductName: product.nombre, score: commonTokens };
        }
    }
    if (best)
        return { id: best.id, matchedProductName: best.matchedProductName };
    let top = null;
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
function fuzzySimilarity(a, b) {
    const distance = levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0)
        return 1;
    return 1 - distance / maxLen;
}
function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++)
        matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++)
        matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }
    return matrix[a.length][b.length];
}
function compareProviderPrices(cotizaciones) {
    const groups = new Map();
    cotizaciones.forEach((cotizacion) => {
        cotizacion.items.forEach((item) => {
            var _a, _b, _c;
            const name = ((_a = item.producto) === null || _a === void 0 ? void 0 : _a.nombre) || item.nombreDetectado || item.nombreOcr || "";
            const canonical = canonicalizeProductName(name);
            if (!canonical)
                return;
            const presentation = normalizeProductName(item.presentacion || "");
            const key = `${canonical}|${presentation}`;
            const list = (_b = groups.get(key)) !== null && _b !== void 0 ? _b : [];
            list.push({ provider: cotizacion.proveedor.nombre, price: Number(item.precio), product: ((_c = item.producto) === null || _c === void 0 ? void 0 : _c.nombre) || item.nombreDetectado || item.nombreOcr, presentation });
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
