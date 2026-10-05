const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const rawData = await prisma.$queryRaw`
      SELECT 
        i.id,
        i.item_code,
        i.item_name,
        i.category as category_name,
        i.unit,
        i.minimum_stock,
        i.photo_url,
        COALESCE(si.total_in, 0) AS total_in,
        COALESCE(so.total_out, 0) AS total_out
      FROM items i
      LEFT JOIN (
        SELECT item_code, SUM(quantity) as total_in FROM stock_in GROUP BY item_code
      ) si ON i.item_code = si.item_code
      LEFT JOIN (
        SELECT item_code, SUM(quantity) as total_out FROM stock_out GROUP BY item_code
      ) so ON i.item_code = so.item_code
      ORDER BY i.item_code ASC
    `;
    console.log(JSON.stringify(rawData[0], null, 2));
  } catch(e) {
    console.error("PRISMA ERROR: ", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
