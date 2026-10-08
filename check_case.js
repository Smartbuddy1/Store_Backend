const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.item.findMany({ take: 5 });
  console.log('Sample Items:', items.map(i => ({ id: i.id, code: i.itemCode, cat: i.categoryName })));
  
  const elecItems = await prisma.item.findMany({ where: { categoryName: 'Electronics' } });
  console.log(`Found ${elecItems.length} items for categoryName = "Electronics"`);
  
  const elecItemsUpper = await prisma.item.findMany({ where: { categoryName: 'ELECTRONICS' } });
  console.log(`Found ${elecItemsUpper.length} items for categoryName = "ELECTRONICS"`);
}

main().finally(() => prisma.$disconnect());
