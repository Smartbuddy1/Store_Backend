const p = require('./src/config/supabase');
async function test() {
  console.time('parallel');
  try {
    const fromDateStr = new Date(Date.now() - 6*86400000).toISOString().split('T')[0];
    const results = await Promise.all([
      // getDashboardStats part 1
      p.$queryRawUnsafe(`
        SELECT 
          i.minimum_stock,
          i.category as category_name,
          COALESCE(si.total_in, 0) AS total_in,
          COALESCE(so.total_out, 0) AS total_out
        FROM items i
        LEFT JOIN (
          SELECT item_code, SUM(quantity) as total_in FROM stock_in GROUP BY item_code
        ) si ON i.item_code = si.item_code
        LEFT JOIN (
          SELECT item_code, SUM(quantity) as total_out FROM stock_out GROUP BY item_code
        ) so ON i.item_code = so.item_code
      `),
      // getDashboardStats part 2
      p.stockIn.findMany({ where: { date: { gte: new Date(fromDateStr) } }, select: { date: true } }),
      p.stockOut.findMany({ where: { date: { gte: new Date(fromDateStr) } }, select: { date: true } }),
      // stockIn paginated
      p.stockIn.findMany({ skip: 0, take: 10 }),
      p.stockIn.count(),
      // stockOut paginated
      p.stockOut.findMany({ skip: 0, take: 10 }),
      p.stockOut.count()
    ]);
    console.log('All parallel queries succeeded!', results.map(r => Array.isArray(r) ? r.length : r));
  } catch (e) {
    console.error('Parallel error:', e);
  } finally {
    console.timeEnd('parallel');
    await p.$disconnect();
  }
}
test();
