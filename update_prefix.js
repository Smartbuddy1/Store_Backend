const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateData() {
  try {
    console.log('Updating Categories...');
    await prisma.category.update({
      where: { name: 'Electrical' },
      data: { prefix: 'E' }
    });
    console.log('Updated Electrical prefix to E');

    await prisma.category.update({
      where: { name: 'Electronics' },
      data: { prefix: 'Ex' }
    });
    console.log('Updated Electronics prefix to Ex');

    console.log('Fetching Electronics items...');
    const electronicsItems = await prisma.item.findMany({
      where: { categoryName: 'Electronics' }
    });

    console.log(`Found ${electronicsItems.length} Electronics items. Updating item codes...`);
    let updatedItems = 0;
    
    for (const item of electronicsItems) {
      if (item.itemCode.startsWith('E-')) {
        const newItemCode = item.itemCode.replace('E-', 'Ex-');
        
        // Since we can't easily cascade update the primary key if it's referenced, 
        // we might have to update StockOut and StockIn manually first or Prisma might do it if there's no FK constraint issue.
        // Wait, the schema has `onDelete: Cascade` but NOT `onUpdate: Cascade`.
        // Let's try updating item directly. If it fails due to FK, we'll handle it.
        
        try {
            await prisma.item.update({
              where: { id: item.id },
              data: { itemCode: newItemCode }
            });
            updatedItems++;
        } catch (e) {
            if (e.code === 'P2003') { // Foreign key constraint failed
                // We need to update dependent tables first.
                // Wait, itemCode is referenced. So we must insert a new item, update dependencies, delete old item.
                // Or just use raw SQL to update with cascade.
                await prisma.$executeRaw`UPDATE "items" SET "item_code" = ${newItemCode} WHERE "id" = ${item.id}::uuid;`;
                await prisma.$executeRaw`UPDATE "stock_out" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
                await prisma.$executeRaw`UPDATE "stock_in" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
                // Actually raw SQL for item first might fail if not DEFERRED.
                // Let's do raw SQL for children, then parent.
                await prisma.$executeRaw`UPDATE "stock_out" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
                await prisma.$executeRaw`UPDATE "stock_in" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
                await prisma.$executeRaw`UPDATE "kit_items" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
                await prisma.$executeRaw`UPDATE "requisition_items" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
                
                await prisma.item.update({
                    where: { id: item.id },
                    data: { itemCode: newItemCode }
                });
                updatedItems++;
            } else {
                throw e;
            }
        }
      }
    }
    
    console.log(`Successfully updated ${updatedItems} Electronics items itemCode to Ex-...`);

  } catch (error) {
    console.error('Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateData();
