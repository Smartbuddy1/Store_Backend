const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const data = await prisma.item.create({
      data: {
        itemCode: 'EX-003',
        itemName: 'duplicate code test',
        categoryName: 'Electronic',
        unit: 'nos',
        minimumStock: 5,
        description: null
      }
    });
    console.log("Success:", data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
