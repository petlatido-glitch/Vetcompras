#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Reverting auto-created productos from cotizaciones: detach items and delete productos');

  // Make producto_id nullable so we can detach
  try {
    await prisma.$executeRaw`ALTER TABLE "cotizacion_items" ALTER COLUMN "producto_id" DROP NOT NULL`;
    console.log('Ensured cotizacion_items.producto_id is nullable');
  } catch (e) {
    console.warn('Could not alter column (maybe already nullable):', e.message || e);
  }

  // Heuristic for auto-created products (same used before)
  const candidates = await prisma.producto.findMany({
    where: {
      categoria: 'OTRO',
      proveedorId: null,
      stockActual: 0,
      cotizacionItems: { some: {} }
    },
    include: { movimientos: { take: 1 }, cotizacionItems: { take: 1 } }
  });

  const toDelete = candidates.filter(p => (p.movimientos || []).length === 0);
  if (toDelete.length === 0) {
    console.log('No auto-created productos found to delete.');
    return;
  }

  const ids = toDelete.map(p => p.id);
  console.log(`Detaching productoId from ${ids.length} cotizacion_items and deleting ${ids.length} productos.`);


  // Use raw SQL to nullify producto_id because the generated Prisma client may
  // still treat the column as non-nullable until prisma generate is run.
  const idList = ids.map(id => `'${id}'`).join(',');
  await prisma.$executeRawUnsafe(`UPDATE "cotizacion_items" SET "producto_id" = NULL WHERE "producto_id" IN (${idList})`);

  await prisma.producto.deleteMany({ where: { id: { in: ids } } });

  console.log('Detach and delete completed.');
}

main().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
}).finally(() => process.exit(0));
