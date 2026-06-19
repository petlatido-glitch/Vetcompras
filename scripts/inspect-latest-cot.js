const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { items: true, proveedor: true }
    });
    console.log(JSON.stringify(cotizaciones, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
