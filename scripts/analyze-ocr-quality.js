const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    // Get the last 5 cotizaciones with their items
    const cotizaciones = await prisma.cotizacion.findMany({
      take: -5, // Last 5
      include: {
        items: true,
        proveedor: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("\n========================================");
    console.log("ANÁLISIS DE CALIDAD OCR");
    console.log("========================================\n");

    let totalItems = 0;
    let categorizedItems = {
      correcto: [],
      dudoso: [],
      rechazado: [],
    };

    for (const cot of cotizaciones) {
      console.log(`\n--- COTIZACIÓN #${cot.id} ---`);
      console.log(`Proveedor: ${cot.proveedor.nombre}`);
      console.log(`Items: ${cot.items.length}`);

      for (const item of cot.items) {
        totalItems++;
        const confidence = item.confianza || 0;
        const hasNombre = !!(item.nombreDetectado && item.nombreDetectado.trim());
        const hasPrecio = item.precio !== null && item.precio !== undefined;
        const hasPresentacion = !!(item.presentacion && item.presentacion.trim());
        const hasLaboratorio = !!(item.laboratorio && item.laboratorio.trim());

        // Classify
        let category = "rechazado";
        if (
          hasNombre &&
          hasPrecio &&
          hasPresentacion &&
          hasLaboratorio &&
          confidence >= 80
        ) {
          category = "correcto";
        } else if ((hasNombre && hasPrecio) || confidence >= 50) {
          category = "dudoso";
        }

        categorizedItems[category].push({
          ocr: item.nombreOCR,
          detectado: item.nombreDetectado,
          precio: item.precio,
          presentacion: item.presentacion,
          laboratorio: item.laboratorio,
          confianza: confidence,
          estado: item.estado,
          revisado: item.revisado,
        });

        // Print
        console.log(
          `\n  [${category.toUpperCase()}] Confianza: ${confidence}%`
        );
        console.log(`    OCR: "${item.nombreOCR}"`);
        console.log(`    Detectado: "${item.nombreDetectado}"`);
        console.log(`    Presentación: ${item.presentacion || "N/A"}`);
        console.log(`    Laboratorio: ${item.laboratorio || "N/A"}`);
        console.log(`    Precio: $${item.precio || "N/A"}`);
        console.log(`    Estado: ${item.estado || "N/A"}`);
      }
    }

    console.log("\n========================================");
    console.log("RESUMEN GENERAL");
    console.log("========================================");
    console.log(`Total items: ${totalItems}`);
    console.log(
      `✓ Correctos: ${categorizedItems.correcto.length} (${((categorizedItems.correcto.length / totalItems) * 100).toFixed(1)}%)`
    );
    console.log(
      `⚠ Dudosos: ${categorizedItems.dudoso.length} (${((categorizedItems.dudoso.length / totalItems) * 100).toFixed(1)}%)`
    );
    console.log(
      `✗ Rechazados: ${categorizedItems.rechazado.length} (${((categorizedItems.rechazado.length / totalItems) * 100).toFixed(1)}%)`
    );

    console.log("\n========================================");
    console.log("EJEMPLOS DE LÍNEAS CORRECTAS");
    console.log("========================================");
    categorizedItems.correcto.slice(0, 5).forEach((item, i) => {
      console.log(`\n${i + 1}. "${item.ocr}"`);
      console.log(`   ✓ Detectado: ${item.detectado}`);
      console.log(`   ✓ Precio: $${item.precio}`);
      console.log(`   ✓ Presentación: ${item.presentacion}`);
      console.log(`   ✓ Laboratorio: ${item.laboratorio}`);
    });

    console.log("\n========================================");
    console.log("EJEMPLOS DE LÍNEAS DUDOSAS");
    console.log("========================================");
    categorizedItems.dudoso.slice(0, 5).forEach((item, i) => {
      console.log(`\n${i + 1}. "${item.ocr}"`);
      console.log(`   ⚠ Detectado: ${item.detectado}`);
      console.log(`   ⚠ Precio: $${item.precio}`);
      console.log(`   ⚠ Presentación: ${item.presentacion || "FALTA"}`);
      console.log(`   ⚠ Laboratorio: ${item.laboratorio || "FALTA"}`);
    });

    console.log("\n========================================");
    console.log("EJEMPLOS DE LÍNEAS RECHAZADAS");
    console.log("========================================");
    categorizedItems.rechazado.slice(0, 10).forEach((item, i) => {
      console.log(`\n${i + 1}. "${item.ocr}"`);
      console.log(`   ✗ Detectado: ${item.detectado || "NADA"}`);
      console.log(`   ✗ Precio: ${item.precio ? "$" + item.precio : "NADA"}`);
      console.log(
        `   ✗ Presentación: ${item.presentacion || "NADA"}`
      );
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
