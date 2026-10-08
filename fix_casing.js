const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCasing() {
  try {
    console.log('Fixing Electronics item codes...');
    const electronicsItems = await prisma.item.findMany({
      where: { categoryName: 'Electronics' }
    });

    let updatedCount = 0;
    for (const item of electronicsItems) {
      if (item.itemCode.startsWith('Ex-')) {
        const newItemCode = 'EX-' + item.itemCode.substring(3);
        
        await prisma.$executeRaw`UPDATE "stock_out" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
        await prisma.$executeRaw`UPDATE "stock_in" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
        await prisma.$executeRaw`UPDATE "kit_items" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
        await prisma.$executeRaw`UPDATE "requisition_items" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
        await prisma.$executeRaw`UPDATE "items" SET "item_code" = ${newItemCode} WHERE "id" = ${item.id}::uuid;`;
        
        updatedCount++;
      }
    }
    console.log(`Successfully fixed casing for ${updatedCount} items from Ex- to EX-.`);
  } catch (error) {
    console.error('Error fixing casing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCasing();
