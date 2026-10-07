const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.time('query');
  const cats = await prisma.category.findMany();
  console.timeEnd('query');
  console.log('Categories:', cats.length);
}
main();
