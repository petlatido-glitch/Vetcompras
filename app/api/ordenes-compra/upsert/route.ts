import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

type OrderItemInput = {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
};

type Body = {
  id?: string;
  compraId?: string;
  proveedorId: string;
  estado?: "BORRADOR" | "GENERADA" | "ENVIADA" | "RECIBIDA" | "CANCELADA";
  items: OrderItemInput[];
  mensajeWhatsapp?: string;
};

function buildMessage(proveedorNombre: string, items: OrderItemInput[], total: number) {
  return [
    `Hola ${proveedorNombre}, queremos realizar el siguiente pedido:`,
    ...items.map((item) => `- ${item.productoId}: ${item.cantidad} x ${formatCurrency(item.precioUnitario)}`),
    `Total estimado: ${formatCurrency(total)}`
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    if (!body.proveedorId) {
      return NextResponse.json({ error: "Proveedor requerido" }, { status: 400 });
    }
    const validItems = Array.isArray(body.items) ? body.items.filter((item) => item.productoId && item.cantidad > 0) : [];
    if (!validItems.length) {
      return NextResponse.json({ error: "Items de orden invalidos" }, { status: 400 });
    }

    const proveedor = await prisma.proveedor.findUnique({ where: { id: body.proveedorId } });
    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 400 });
    }

    const total = validItems.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
    const mensajeWhatsapp = body.mensajeWhatsapp ?? buildMessage(proveedor.nombre, validItems, total);
    const estado = body.estado ?? "GENERADA";

    if (body.id) {
      const orden = await prisma.ordenCompra.update({
        where: { id: body.id },
        data: {
          proveedorId: body.proveedorId,
          mensajeWhatsapp,
          compra: {
            update: {
              estado
            }
          },
          items: {
            deleteMany: {},
            create: validItems.map((item) => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario
            }))
          }
        }
      });

      return NextResponse.json({ success: true, ordenId: orden.id });
    }

    const compra = await prisma.compra.create({
      data: {
        ahorroEstimado: total,
        estado
      }
    });

    const orden = await prisma.ordenCompra.create({
      data: {
        compraId: compra.id,
        proveedorId: body.proveedorId,
        mensajeWhatsapp,
        items: {
          create: validItems.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario
          }))
        }
      }
    });

    return NextResponse.json({ success: true, ordenId: orden.id });
  } catch (error) {
    console.error("ordenes upsert error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
