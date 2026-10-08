const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oldCode = 'E-136';
  const newCode = 'E-001';

  console.log(`Fixing item code from ${oldCode} to ${newCode}...`);

  try {
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Check if the item exists
      const item = await tx.item.findUnique({
        where: { itemCode: oldCode }
      });

      if (!item) {
        console.log(`Item with code ${oldCode} not found. Maybe it's already updated?`);
        return;
      }

      // 2. Temporarily disable foreign key constraints or just update child tables first using raw SQL since Prisma doesn't support ON UPDATE CASCADE natively without schema changes
      // Actually, since Prisma checks constraints, we should use $executeRaw to bypass them safely or update dependent tables first.
      // Wait, we need to update dependent tables first, then the parent, BUT Prisma might still complain if we update child first because the newCode doesn't exist in parent yet.
      // Easiest is to insert a dummy, update children, delete old parent, but that loses relations.
      
      // Let's use raw SQL to temporarily defer constraints if possible, or just raw SQL for all updates.
      console.log('Running raw SQL to update item_code...');
      
      // PostgreSQL handles foreign keys with cascade if defined, but Prisma doesn't define it by default in raw postgres unless specified.
      // Let's just run raw SQL to disable constraints, update, and enable. (Postgres requires superuser for session_replication_role)
      // Alternatively, we can just do an INSERT -> UPDATE children -> DELETE.
      
      // Let's create a temporary item, move relations, then delete old item.
      const tempItem = await tx.item.create({
        data: {
          itemCode: newCode,
          itemName: item.itemName,
          categoryName: item.categoryName,
          unit: item.unit,
          minimumStock: item.minimumStock,
          photoUrl: item.photoUrl,
        }
      });
      
      console.log('Created temp item:', tempItem.itemCode);

      // Update all related tables
      await tx.$executeRaw`UPDATE "stock_in" SET "item_code" = ${newCode} WHERE "item_code" = ${oldCode}`;
      await tx.$executeRaw`UPDATE "stock_out" SET "item_code" = ${newCode} WHERE "item_code" = ${oldCode}`;
      await tx.$executeRaw`UPDATE "kit_items" SET "item_code" = ${newCode} WHERE "item_code" = ${oldCode}`;
      await tx.$executeRaw`UPDATE "requisition_items" SET "item_code" = ${newCode} WHERE "item_code" = ${oldCode}`;
      
      console.log('Updated related tables.');

      // Delete the old item
      await tx.item.delete({
        where: { itemCode: oldCode }
      });
      
      console.log(`Successfully changed item code from ${oldCode} to ${newCode}`);
    });
  } catch (error) {
    console.error("Failed to update item code:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
