const prisma = require('../config/supabase');

const getStockIn = async (req, res) => {
  const { search, category, source, from_date, to_date } = req.query;
  try {
    const data = await prisma.stockIn.findMany({
      where: {
        ...(category && { category }),
        ...(source && { source }),
        ...(from_date && { date: { gte: new Date(from_date) } }),
        ...(to_date && { date: { lte: new Date(to_date) } }),
        ...(search && {
          OR: [
            { itemName: { contains: search, mode: 'insensitive' } },
            { itemCode: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createStockIn = async (req, res) => {
  const { date, time, item_code, item_name, category, quantity, source, remarks } = req.body;
  if (!date || !time || !item_code || !item_name || !quantity) {
    return res.status(400).json({ success: false, message: 'date, time, item_code, item_name, quantity required' });
  }
  try {
    const data = await prisma.stockIn.create({
      data: {
        date: new Date(date),
        time,
        itemCode: item_code,
        itemName: item_name,
        category: category || null,
        quantity: parseFloat(quantity),
        source: source || 'Supplier',
        remarks: remarks || null
      }
    });
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateStockIn = async (req, res) => {
  const { id } = req.params;
  const { date, time, item_code, item_name, category, quantity, source, remarks } = req.body;
  try {
    const data = await prisma.stockIn.update({
      where: { id },
      data: { date: new Date(date), time, itemCode: item_code, itemName: item_name, category, quantity: parseFloat(quantity), source, remarks }
    });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteStockIn = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.stockIn.delete({ where: { id } });
    res.json({ success: true, message: 'Stock In deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getStockIn, createStockIn, updateStockIn, deleteStockIn };
