const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cat = await prisma.category.findUnique({ where: { name: 'Electronics' } });
  console.log('Electronics Category:', cat);
}

main().finally(() => prisma.$disconnect());
