const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const found = await prisma.producto.findMany({ where: { nombre: { contains: 'Producto prueba desde API' } }, orderBy: { nombre: 'asc' } });
    console.log('found', found.map(p => ({ id: p.id, nombre: p.nombre })));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
