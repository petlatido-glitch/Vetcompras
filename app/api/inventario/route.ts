import { NextResponse } from "next/server";
import { getInventario } from "@/lib/actions/inventario";

export async function GET() {
  try {
    const items = await getInventario();
    return NextResponse.json({
      success: true,
      items
    });
  } catch (error) {
    console.error("Error fetching inventario:", error);
    return NextResponse.json(
      { error: "Error al obtener inventario" },
      { status: 500 }
    );
  }
}
