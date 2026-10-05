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

    rawData.forEach(item => {
      const totalIn = Number(item.total_in);
      const totalOut = Number(item.total_out);
      const currentQty = totalIn - totalOut;
      const minStock = Number(item.minimum_stock);

      if (totalIn > 0) totalQtyIn += 1;
      if (totalOut > 0) totalQtyOut += 1;
      
      if (currentQty <= 0) outOfStock++;
      else if (currentQty <= minStock) lowStock++;
      else goodStock++;
    });

    res.json({
      success: true,
      data: {
        totalItems: rawData.length,
        lowStock,
        outOfStock,
        goodStock,
        totalQtyIn,
        totalQtyOut
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getCurrentStock, getDashboardStats };
