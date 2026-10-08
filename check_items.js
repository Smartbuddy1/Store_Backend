const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log('Categories:', categories);

  const elecItems = await prisma.item.findMany({ where: { categoryName: 'Electrical' }, take: 5 });
  console.log('Electrical Items (sample):', elecItems.map(i => i.itemCode));

  const electronicsItems = await prisma.item.findMany({ where: { categoryName: 'Electronics' }, take: 5 });
  console.log('Electronics Items (sample):', electronicsItems.map(i => i.itemCode));
}

main().finally(() => prisma.$disconnect());
