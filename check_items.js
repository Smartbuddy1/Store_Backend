const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.$queryRawUnsafe('SELECT * FROM items');
  console.log(items);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
