import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export interface InventarioItem {
  id: string;
  nombre: string;
  nombreGenerico?: string;
  laboratorio?: string;
  marca?: string;
  presentacion?: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  precioPromedio?: number;
  ultimoPrecio?: number;
  fechaUltimaEntrada?: Date;
  estado: "normal" | "bajo" | "critico";
  proveedor?: string;
}

export interface MovimientoItem {
  id: string;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE" | "COMPRA" | "USO_CLINICO" | "MERMA";
  cantidad: number;
  cantidadAntes: number;
  cantidadDespues: number;
  motivo?: string;
  usuario?: string;
  fecha: Date;
}

export async function getInventario(): Promise<InventarioItem[]> {
  const productos = await prisma.producto.findMany({
    where: { estado: "ACTIVO" },
    include: {
      proveedor: { select: { nombre: true } },
      historiales: {
        orderBy: { fecha: "desc" },
        take: 1
      },
      movimientos: {
        where: { tipo: "ENTRADA" },
        orderBy: { fecha: "desc" },
        take: 1
      }
    },
    orderBy: { nombre: "asc" }
  });

  return productos.map(producto => {
    const stockActual = producto.stockActual;
    const stockMinimo = producto.stockMinimo;
    
    let estado: "normal" | "bajo" | "critico" = "normal";
    if (stockActual <= 2) {
      estado = "critico";
    } else if (stockActual <= 5) {
      estado = "bajo";
    }

    const ultimoHistorial = producto.historiales[0];
    const ultimoMovimiento = producto.movimientos[0];
    const ultimoPrecio = ultimoHistorial?.precio 
      ? parseFloat(ultimoHistorial.precio.toString()) 
      : undefined;

    return {
      id: producto.id,
      nombre: producto.nombre,
      laboratorio: producto.laboratorio || undefined,
      marca: producto.marca || undefined,
      presentacion: producto.presentacion || undefined,
      unidad: producto.unidad,
      stockActual,
      stockMinimo,
      precioPromedio: ultimoPrecio,
      ultimoPrecio: ultimoPrecio,
      fechaUltimaEntrada: ultimoMovimiento?.fecha,
      estado,
      proveedor: producto.proveedor?.nombre
    };
  });
}

export async function getMovimientosProducto(
  productoId: string,
  limit: number = 50
): Promise<MovimientoItem[]> {
  const movimientos = await prisma.movimientoInventario.findMany({
    where: { productoId },
    orderBy: { fecha: "desc" },
    take: limit
  });

  return movimientos.map(m => ({
    id: m.id,
    tipo: m.tipo as any,
    cantidad: m.cantidad,
    cantidadAntes: m.cantidadAntes,
    cantidadDespues: m.cantidadDespues,
    motivo: m.motivo || undefined,
    usuario: m.usuario || undefined,
    fecha: m.fecha
  }));
}
