const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addIndexes() {
  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_stock_in_item_code ON stock_in(item_code)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_stock_out_item_code ON stock_out(item_code)`);
    console.log('Indexes created successfully');
  } catch (err) {
    console.error('Error creating indexes:', err);
  } finally {
    await prisma.$disconnect();
  }
}
addIndexes();
