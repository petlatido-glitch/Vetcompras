import { z } from "zod";

export const categorias = [
  "MEDICAMENTOS",
  "ANTIPARASITARIO",
  "ALIMENTO",
  "INSUMO_MEDICO",
  "HOSPITALARIO",
  "VACUNAS",
  "JUGUETES",
  "ACCESORIOS",
  "OTRO",
  "CONCENTRADOS",
  "INSUMOS"
] as const;

export const unidades = [
  "unidad",
  "ml",
  "tableta",
  "cápsula",
  "frasco",
  "kg",
  "g",
  "bolsa",
  "caja"
] as const;

export const estadosProducto = ["ACTIVO", "INACTIVO"] as const;
export const categoriasProveedor = ["MEDICAMENTOS", "CONCENTRADOS", "LABORATORIO", "ACCESORIOS", "VACUNAS", "VARIOS"] as const;
export const estadosProveedor = ["ACTIVO", "INACTIVO"] as const;

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  return z.coerce.number().parse(value);
}, z.number().nonnegative().optional());

const optionalDate = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  return z.coerce.date().parse(value);
}, z.date().optional());

const optionalString = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return String(value);
}, z.string().trim().optional());

const optionalUuid = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined || value === "undefined") return undefined;
  return String(value);
}, z.string().uuid().optional());

export const productoSchema = z.object({
  id: optionalUuid,
  nombre: z.string().min(2, "Ingresa un nombre valido"),
  categoria: z.enum(categorias),
  marca: z.string().trim().optional(),
  laboratorio: z.string().trim().optional(),
  proveedorId: optionalUuid,
  sku: z.string().trim().optional(),
  unidad: z.enum(unidades),
  presentacion: z.string().trim().optional(),
  precioCompra: optionalNumber,
  precioSugerido: optionalNumber,
  ultimoCosto: optionalNumber,
  stockActual: z.coerce.number().int().min(0),
  stockMinimo: z.coerce.number().int().min(0),
  lote: z.string().trim().optional(),
  fechaVencimiento: optionalDate,
  observaciones: z.string().trim().optional(),
  estado: z.enum(estadosProducto).default("ACTIVO")
});

export const proveedorSchema = z.object({
  id: optionalUuid,
  nombre: z.string().min(2, "Ingresa un nombre comercial válido"),
  contacto: optionalString,
  telefono: optionalString.refine((v) => !v || /^\+?[0-9 \-()]{7,20}$/.test(v), {
    message: "Teléfono inválido"
  }),
  whatsapp: optionalString.refine((v) => !v || /^\+?[0-9 \-()]{7,20}$/.test(v), {
    message: "WhatsApp inválido"
  }),
  email: optionalString.refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), {
    message: "Email inválido"
  }),
  ciudad: optionalString,
  direccion: optionalString,
  categoria: z.enum(categoriasProveedor).default("VARIOS"),
  estado: z.enum(estadosProveedor).default("ACTIVO"),
  notas: optionalString
});

export const listaCompraSchema = z
  .object({
    id: optionalUuid,
    productoId: optionalUuid,
    nombreManual: z.string().trim().optional(),
    cantidadRequerida: z.coerce.number().int().min(1),
    estado: z.enum(["PENDIENTE", "COTIZADO", "COMPRADO", "RECIBIDO"]).optional(),
    notas: z.string().trim().optional()
  })
  .refine((val) => !!(val.productoId || val.nombreManual), {
    message: "Se debe indicar un producto o un nombre manual",
    path: ["productoId", "nombreManual"]
  });

export const cotizacionSchema = z.object({
  proveedorId: z.string().uuid(),
  fecha: z.coerce.date(),
  archivoUrl: z.string().min(1),
  archivoNombre: z.string().min(1),
  archivoTipo: z.string().min(1)
});

export const cotizacionItemSchema = z.object({
  cotizacionId: z.string().uuid(),
  productoId: z.string().uuid().optional(),
  nombreDetectado: z.string().min(1),
  precio: z.coerce.number().positive(),
  presentacion: z.string().optional()
});

export type ProductoInput = z.input<typeof productoSchema>;
export type ProductoOutput = z.infer<typeof productoSchema>;
export type ProveedorInput = z.infer<typeof proveedorSchema>;
export type ListaCompraInput = z.infer<typeof listaCompraSchema>;
