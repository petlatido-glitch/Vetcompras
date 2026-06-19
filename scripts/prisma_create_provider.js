const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const provider = await prisma.proveedor.create({
      data: {
        nombre: 'Proveedor Prueba Veterinaria',
        contacto: 'Ana Ramirez',
        telefono: '3412345678',
        whatsapp: '3419876543',
        email: 'contacto@vetprueba.com',
        ciudad: 'Rosario',
        direccion: 'Calle Falsa 123',
        categoria: 'MEDICAMENTOS',
        estado: 'ACTIVO',
        notas: 'Proveedor de medicación y vacunas.'
      }
    });
    console.log('created', provider.id);
    const found = await prisma.proveedor.findUnique({ where: { id: provider.id } });
    console.log('found', found);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();