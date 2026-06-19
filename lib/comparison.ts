import type { Prisma } from "@prisma/client";

export type QuoteItemForComparison = {
  productoId: string;
  productoNombre: string;
  proveedorId: string;
  proveedorNombre: string;
  precio: Prisma.Decimal | number | string;
};

export type PurchaseNeed = {
  productoId: string;
  cantidadRequerida: number;
};

export type ComparisonResult = {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  mejorProveedorId: string;
  mejorProveedor: string;
  mejorPrecio: number;
  precioNormal: number;
  diferencia: number;
  opciones: Array<{
    proveedor: string;
    precio: number;
    diferencia: number;
  }>;
};

export type CotizacionComparisonItem = {
  productoEtiqueta: string;
  presentacion: string;
  proveedor: string;
  precio: number;
  fechaCotizacion: string;
};

export function buildComparisonFromCotizacionItems(items: CotizacionComparisonItem[]) {
  const grouped = new Map<string, CotizacionComparisonItem[]>();

  for (const item of items) {
    const key = `${item.productoEtiqueta}||${item.presentacion}`;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  const results: ComparisonResult[] = Array.from(grouped.entries()).map(([key, productItems], index) => {
    const sorted = [...productItems].sort((a, b) => a.precio - b.precio);
    const best = sorted[0];
    const normal = sorted[sorted.length - 1].precio;
    const cantidad = 1;

    return {
      productoId: key,
      productoNombre: best.productoEtiqueta,
      cantidad,
      mejorProveedorId: `${best.proveedor}-${index}`,
      mejorProveedor: best.proveedor,
      mejorPrecio: best.precio,
      precioNormal: normal,
      diferencia: (normal - best.precio) * cantidad,
      opciones: sorted.map((item) => ({
        proveedor: item.proveedor,
        precio: item.precio,
        diferencia: item.precio - best.precio
      }))
    };
  });

  const costoNormal = results.reduce((sum, item) => sum + item.precioNormal * item.cantidad, 0);
  const costoOptimizado = results.reduce((sum, item) => sum + item.mejorPrecio * item.cantidad, 0);

  return {
    results,
    costoNormal,
    costoOptimizado,
    ahorroEstimado: costoNormal - costoOptimizado
  };
}

export function buildComparison(items: QuoteItemForComparison[], needs: PurchaseNeed[]) {
  const needsByProduct = new Map(needs.map((need) => [need.productoId, need.cantidadRequerida]));
  const grouped = new Map<string, QuoteItemForComparison[]>();

  items.forEach((item) => {
    if (!needsByProduct.has(item.productoId)) return;
    grouped.set(item.productoId, [...(grouped.get(item.productoId) ?? []), item]);
  });

  const results: ComparisonResult[] = Array.from(grouped.entries()).flatMap(([productoId, productItems]) => {
    const sorted = productItems
      .map((item) => ({ ...item, precioNumber: Number(item.precio) }))
      .sort((a, b) => a.precioNumber - b.precioNumber);

    const best = sorted[0];
    if (!best) return [];

    const cantidad = needsByProduct.get(productoId) ?? 1;
    const normal = sorted.length > 1 ? sorted[sorted.length - 1].precioNumber : best.precioNumber;

    return {
      productoId,
      productoNombre: best.productoNombre,
      cantidad,
      mejorProveedorId: best.proveedorId,
      mejorProveedor: best.proveedorNombre,
      mejorPrecio: best.precioNumber,
      precioNormal: normal,
      diferencia: (normal - best.precioNumber) * cantidad,
      opciones: sorted.map((item) => ({
        proveedor: item.proveedorNombre,
        precio: item.precioNumber,
        diferencia: item.precioNumber - best.precioNumber
      }))
    };
  });

  const costoNormal = results.reduce((sum, item) => sum + item.precioNormal * item.cantidad, 0);
  const costoOptimizado = results.reduce((sum, item) => sum + item.mejorPrecio * item.cantidad, 0);

  return {
    results,
    costoNormal,
    costoOptimizado,
    ahorroEstimado: costoNormal - costoOptimizado
  };
}
