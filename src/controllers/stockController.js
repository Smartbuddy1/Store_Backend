const prisma = require('../config/supabase');

// Current stock (computed from stock_in - stock_out using Prisma aggregates)
const getCurrentStock = async (req, res) => {
  const { search, category, status } = req.query;
  try {
    // Get all items
    const items = await prisma.item.findMany({
      where: {
        ...(category && { categoryName: category }),
        ...(search && {
          OR: [
            { itemName: { contains: search, mode: 'insensitive' } },
            { itemCode: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        stockIns: { select: { quantity: true } },
        stockOuts: { select: { quantity: true } }
      },
      orderBy: { itemCode: 'asc' }
    });

    const stockData = items.map(item => {
      const totalIn = item.stockIns.reduce((sum, s) => sum + s.quantity, 0);
      const totalOut = item.stockOuts.reduce((sum, s) => sum + s.quantity, 0);
      const currentQty = totalIn - totalOut;
      const itemStatus =
        currentQty <= 0 ? 'Empty' :
        currentQty <= item.minimumStock ? 'Low' : 'Good';

      return {
        id: item.id,
        item_code: item.itemCode,
        item_name: item.itemName,
        category: item.categoryName,
        unit: item.unit,
        minimum_stock: item.minimumStock,
        total_in: totalIn,
        total_out: totalOut,
        current_qty: currentQty,
        status: itemStatus
      };
    }).filter(item => !status || item.status === status);

    res.json({ success: true, data: stockData });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Dashboard summary stats
const getDashboardStats = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        stockIns: { select: { quantity: true } },
        stockOuts: { select: { quantity: true } }
      }
    });

    let totalQtyIn = 0, totalQtyOut = 0, lowStock = 0, outOfStock = 0, goodStock = 0;

    items.forEach(item => {
      const totalIn = item.stockIns.reduce((sum, s) => sum + s.quantity, 0);
      const totalOut = item.stockOuts.reduce((sum, s) => sum + s.quantity, 0);
      const currentQty = totalIn - totalOut;
      if (totalIn > 0) totalQtyIn += 1;
      if (totalOut > 0) totalQtyOut += 1;
      if (currentQty <= 0) outOfStock++;
      else if (currentQty <= item.minimumStock) lowStock++;
      else goodStock++;
    });

    res.json({
      success: true,
      data: {
        totalItems: items.length,
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
