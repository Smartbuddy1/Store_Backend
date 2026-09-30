const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.$queryRawUnsafe(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'items'`);
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}
main().finally(() => prisma.$disconnect());
