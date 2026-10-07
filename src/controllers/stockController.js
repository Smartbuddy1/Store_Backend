const prisma = require('../config/supabase');

// Current stock (computed from stock_in - stock_out using Prisma aggregates)
const getCurrentStock = async (req, res) => {
  const { search, category, status } = req.query;
  try {
    const rawData = await prisma.$queryRawUnsafe(`
      SELECT 
        i.id,
        i.item_code,
        i.item_name,
        i.category as category_name,
        i.unit,
        i.minimum_stock,
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
    `);

    const stockData = rawData.map(item => {
      // Prisma $queryRaw returns Decimal or BigInt for SUMs, so convert to number
      const totalIn = Number(item.total_in);
      const totalOut = Number(item.total_out);
      const currentQty = totalIn - totalOut;
      const minStock = Number(item.minimum_stock);
      
      const itemStatus =
        currentQty <= 0 ? 'Empty' :
        currentQty <= minStock ? 'Low' : 'Good';

      return {
        id: item.id,
        item_code: item.item_code,
        item_name: item.item_name,
        category: item.category_name,
        unit: item.unit,
        minimum_stock: minStock,
        total_in: totalIn,
        total_out: totalOut,
        current_qty: currentQty,
        status: itemStatus
      };
    }).filter(item => {
      if (status && item.status !== status) return false;
      if (category && item.category !== category) return false;
      if (search) {
        const term = search.toLowerCase();
        if (!item.item_name.toLowerCase().includes(term) && !item.item_code.toLowerCase().includes(term)) {
          return false;
        }
      }
      return true;
    });

    res.json({ success: true, data: stockData });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Dashboard summary stats
const getDashboardStats = async (req, res) => {
  try {
    const rawData = await prisma.$queryRawUnsafe(`
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
    `);

    let totalQtyIn = 0, totalQtyOut = 0, lowStock = 0, outOfStock = 0, goodStock = 0;
    const categoriesCount = {};

    rawData.forEach(item => {
      const totalIn = Number(item.total_in);
      const totalOut = Number(item.total_out);
      const currentQty = totalIn - totalOut;
      const minStock = Number(item.minimum_stock);
      const cat = item.category_name || 'Uncategorized';

      categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;

      if (totalIn > 0) totalQtyIn += 1;
      if (totalOut > 0) totalQtyOut += 1;
      
      if (currentQty <= 0) outOfStock++;
      else if (currentQty <= minStock) lowStock++;
      else goodStock++;
    });

    // Compute chart data on backend
    const d7 = new Date();
    d7.setDate(d7.getDate() - 6);
    const fromDateStr = d7.toISOString().split('T')[0];
    
    const [recentIn, recentOut] = await Promise.all([
      prisma.stockIn.findMany({ where: { date: { gte: new Date(fromDateStr) } }, select: { date: true } }),
      prisma.stockOut.findMany({ where: { date: { gte: new Date(fromDateStr) } }, select: { date: true } })
    ]);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      chartData.push({ date: dateStr, displayDate, In: 0, Out: 0 });
    }

    recentIn.forEach(r => {
      const d = new Date(r.date).toISOString().split('T')[0];
      const day = chartData.find(c => c.date === d);
      if (day) day.In++;
    });

    recentOut.forEach(r => {
      const d = new Date(r.date).toISOString().split('T')[0];
      const day = chartData.find(c => c.date === d);
      if (day) day.Out++;
    });

    res.json({
      success: true,
      data: {
        totalItems: rawData.length,
        lowStock,
        outOfStock,
        goodStock,
        totalQtyIn,
        totalQtyOut,
        categoriesCount,
        chartData
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getCurrentStock, getDashboardStats };
