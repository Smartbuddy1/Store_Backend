const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearStockIn() {
  try {
    console.log('Deleting all records from StockIn table...');
    const result = await prisma.stockIn.deleteMany({});
    console.log(`Successfully deleted ${result.count} records.`);
  } catch (error) {
    console.error('Error deleting records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearStockIn();
