const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  try{
    const p = await prisma.proveedor.create({ data: { nombre: 'Proveedor Test', telefono: null, email: null, notas: 'Creado por script de prueba' } });
    console.log('Created provider id=', p.id);
    await prisma.$disconnect();
    process.exit(0);
  }catch(e){
    console.error('Error creating provider', e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
