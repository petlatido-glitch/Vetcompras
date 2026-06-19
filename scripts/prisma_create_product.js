const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const prod = await prisma.producto.create({
      data: {
        nombre: 'Producto prueba directo',
        categoria: 'MEDICAMENTOS',
        unidad: 'unidad',
        stockActual: 5,
        stockMinimo: 1
      }
    });
    console.log('created', prod.id);
    const all = await prisma.producto.findMany({ orderBy: { nombre: 'asc' }, take: 5 });
    console.log('sample', all.map(p => ({ id: p.id, nombre: p.nombre })));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
