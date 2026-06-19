#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
async function main() {
  console.log('Starting cleanup: marking probable cotizacion/OCR products INACTIVO');

  // Heuristic: products that are referenced by cotizacion_items AND
  // have stockActual == 0 AND proveedorId IS NULL AND categoria == 'OTRO' AND
  // have no movimiento_inventario entries.

  const candidates = await prisma.producto.findMany({
    where: {
      categoria: 'OTRO',
      proveedorId: null,
      stockActual: 0,
      estado: 'ACTIVO',
      cotizacionItems: { some: {} }
    },
    include: {
      movimientos: { take: 1 },
      cotizacionItems: { take: 1 }
    }
  });

  const toMark = candidates.filter(p => (p.movimientos || []).length === 0);

  if (toMark.length === 0) {
    console.log('No candidate products found. Nothing to do.');
    return;
  }

  console.log(`Found ${toMark.length} products to mark INACTIVO. Samples:`);
  toMark.slice(0, 20).forEach(p => console.log(`- ${p.id}\t${p.nombre}\tcreatedAt=${p.createdAt}`));

  const ids = toMark.map(p => p.id);
  const result = await prisma.producto.updateMany({
    where: { id: { in: ids } },
    data: { estado: 'INACTIVO' }
  });

  const logEntry = `${new Date().toISOString()} - marked ${result.count} producto(s) INACTIVO\n`;
  try {
    fs.appendFileSync('logs/cleanup_inventario.log', logEntry);
  } catch (e) {
    // ignore
  }

  console.log(`Marked ${result.count} producto(s) INACTIVO.`);
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
