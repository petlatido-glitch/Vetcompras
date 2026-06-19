# ANÁLISIS Y PROPUESTA DE MEJORAS PARA OCR DE COTIZACIONES

## PROBLEMAS IDENTIFICADOS

### 1. Líneas siendo detectadas incorrectamente como productos:

**Ejemplos teóricos comunes:**
- "DIRECCIÓN: Cra. 45 #23-10 Bogotá" → Se interpreta como producto
- "TELÉFONO: 300 1234567" → Se detecta como línea confusa
- "SUBTOTAL: $450.000" → Se trata de clasificar como producto por el precio
- "IVA (19%): $85.500" → Falsamente detectado como producto
- "OBSERVACIONES: Pago contra entrega" → Se incluye en la lista
- "Página 1 de 3" → Se ve como línea de basura
- "CLIENTE: Hospital Veterinario San José" → Se interpreta como nombre de producto
- "FORMA DE PAGO: Transferencia a 30 días" → Se filtra pero no siempre
- "NIT: 900.123.456-1" → Se rechaza pero toma tiempo evaluarla

### 2. Problemas del sistema actual:

**Scoring débil:**
- El scoring en `isAdministrativeLine` es ambiguo
- Un teléfono con precio falsamente agregado se clasifica como producto
- No hay rechazo automático por palabras clave administrativas

**Falta de capas de filtro:**
- Solo hay dos capas: líneas administrativas vs productos
- No hay categoría intermedia para "dudosos"
- No hay indicador visual de confianza

**Normalización incompleta:**
- "Meloxicam 0.2%" y "MELOXICAM 0,2 %" se tratan como diferentes
- No detecta variaciones de escritura (puntos, comas, espacios)

## SOLUCIÓN PROPUESTA

### CAPA 1: Palabras clave prohibidas (rechazo inmediato)

```
PROHIBIDAS_AUTOMATICO = [
  'subtotal', 'iva', 'nit', 'ruc',
  'dirección', 'dirección:',
  'teléfono', 'tel', 'telefono', 'cel', 'celular',
  'email', 'correo', 'mail',
  'observación', 'observaciones', 'nota', 'notas',
  'forma de pago', 'transferencia',
  'vencimiento', 'plazo', 'condiciones',
  'total', 'neto', 'gravado', 'descuento',
  'porcentaje', '%',
  'página', 'pág',
  'fecha', 'fecha emision', 'emitido',
  'cliente', 'vendedor', 'proveedor',
  'factura', 'cotización',
  'cuenta bancaria', 'transacción',
  'aceptado', 'aprobado', 'rechazado'
]
```

### CAPA 2: Criterios de validación de producto

Una línea es válida SOLO SI cumple:
- ✓ Tiene PRECIO válido (> 0)
- ✓ Tiene NOMBRE/DESCRIPCIÓN (>5 caracteres, no solo números)
- ✓ NO contiene palabras prohibidas
- ✓ NO es solo números/códigos
- ✓ NO es demasiado corta (<10 caracteres normalmente)

### CAPA 3: Sistema de confianza

```
CONFIANZA_ALTA (90-100%):
- nombre + presentación + laboratorio + precio
- nombre + presentación + precio
- Ej: "Meloxicam 0.2% OSA 100ml - $45.000"

CONFIANZA_MEDIA (60-89%):
- nombre + precio (sin presentación/lab detectados)
- nombre detectado de producto conocido + precio
- Ej: "Meloxicam - $45.000" (falta presentación)

CONFIANZA_BAJA (30-59%):
- Detectado por patrón débil
- Precio ambiguo o muy alto
- Nombre poco claro
- Ej: "Producto X - $15" (muy caro o baratos)

RECHAZO (<30%):
- Línea administrativa
- Sin precio
- Palabra prohibida encontrada
- Solo código/número
```

### CAPA 4: Visualización mejorada

En la UI de "Extraer productos":
```
✓ ACEPTADOS (CONFIANZA ALTA)
  - Meloxicam 0.2% OSA 100ml - $45.000
  - Ampicilina 500mg Tecnoquímicas - $8.500

⚠ DUDOSOS (CONFIANZA MEDIA O BAJA)
  - Producto "X" detectado - $15.000 (sin presentación)
  - Nombre ambiguo "Y" - $500.000 (posible error OCR)

✗ RECHAZADOS (LÍNEAS NO VÁLIDAS)
  - "SUBTOTAL: $450.000" (palabra prohibida: SUBTOTAL)
  - "Dirección: Cra 45..." (palabra prohibida: DIRECCIÓN)
  - "TELÉFONO 300123456" (palabra prohibida: TELÉFONO)
  - "Página 1 de 3" (línea administrativa)
```

## CAMBIOS TÉCNICOS REQUERIDOS

### 1. Nueva función en lib/cotizacion-parser.ts:

```typescript
const PROHIBITED_KEYWORDS = [
  'subtotal', 'iva', 'nit', 'ruc', 'dirección', 'teléfono', 'celular', 'email',
  'observación', 'nota', 'forma de pago', 'total', 'descuento', 'página', 'fecha',
  'cliente', 'factura', 'cotización', 'transferencia', 'vencimiento', 'plazo',
  'aprobado', 'rechazado', 'cuenta bancaria', 'aceptado'
];

function hasProhibitedKeyword(line: string): boolean {
  const normalized = normalizeProductName(line).toLowerCase();
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
  if (item.precio && item.precio > 100) score += 30;
  else if (item.precio) score += 10;
  
  // Nombre detectado: +20 puntos
  if (item.nombreDetectado && item.nombreDetectado.length > 5) score += 20;
  
  // Presentación: +25 puntos
  if (item.presentacion) score += 25;
  
  // Laboratorio: +15 puntos
  if (item.laboratorio) score += 15;
  
  // Cantidad: +10 puntos
  if (item.cantidad) score += 10;
  
  return Math.min(100, score);
}
```

### 2. Mejorar isProbableProductLine():

```typescript
function isProbableProductLine(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  
  // Rechazo inmediato por palabra prohibida
  if (hasProhibitedKeyword(normalized)) return false;
  
  // Rechazo por características administrativas
  if (normalized.match(/^\d{1,3}$/)) return false; // Solo números
  if (normalized.length < 10 && !normalized.match(/\w{3,}/)) return false; // Muy corta sin palabras
  if (normalized.match(/^[A-Z0-9\-\/ ]{20,}$/)) return false; // Solo códigos
  
  // Aceptación por característica clara
  if (hasProductHint(normalized)) return true;
  if (parsePresentation(normalized)) return true;
  if (parseLaboratory(normalized)) return true;
  
  // Fallback: necesita al menos 2 palabras alfanuméricas
  const words = normalized.split(/\s+/).filter((token) => /^[A-Za-zÀ-ÿ]{3,}$/.test(token));
  return words.length >= 2;
}
```

### 3. Actualizar parseLineToItemDebug():

```typescript
// Después de detectar un item, antes de retornar:

const confianza = calculateConfidence(item);
const tieneProhibida = hasProhibitedKeyword(item.nombreOCR);

if (tieneProhibida) {
  return {
    item: null,
    rejectedReason: `rechazado: palabra prohibida detectada`
  };
}

item.confianza = confianza;
item.estado = confianza >= 80 ? "ACEPTADO" : confianza >= 60 ? "DUDOSO" : "RECHAZADO";
item.needsReview = confianza < 80;

return { item };
```

## VALIDACIÓN ANTES DE IMPLEMENTACIÓN

Mostrar al usuario:
1. ✓ 8 líneas aceptadas (alta confianza)
2. ⚠ 3 líneas dudosas (baja confianza, requieren revisión)
3. ✗ 12 líneas rechazadas (administrativas, prohibidas, etc.)

Permitir al usuario:
- Ver detalles de por qué fue aceptada/rechazada cada línea
- Mover items entre categorías manualmente
- Editar confianza si lo considera necesario
