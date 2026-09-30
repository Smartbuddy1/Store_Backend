const prisma = require('../config/supabase');

const getStockOut = async (req, res) => {
  const { search, category, handover_to, from_date, to_date } = req.query;
  try {
    const data = await prisma.stockOut.findMany({
      where: {
        ...(category && { category }),
        ...(handover_to && { handoverTo: handover_to }),
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

const createStockOut = async (req, res) => {
  const { date, time, item_code, item_name, category, quantity, handover_to, staff_id, purpose, remarks } = req.body;
  if (!date || !time || !item_code || !item_name || !quantity) {
    return res.status(400).json({ success: false, message: 'date, time, item_code, item_name, quantity required' });
  }
  try {
    const data = await prisma.stockOut.create({
      data: {
        date: new Date(date),
        time,
        itemCode: item_code,
        itemName: item_name,
        category: category || null,
        quantity: parseInt(quantity),
        handoverTo: handover_to || null,
        staffId: staff_id || null,
        purpose: purpose || null,
        remarks: remarks || null
      }
    });
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateStockOut = async (req, res) => {
  const { id } = req.params;
  const { date, time, item_code, item_name, category, quantity, handover_to, staff_id, purpose, remarks } = req.body;
  try {
    const data = await prisma.stockOut.update({
      where: { id },
      data: { date: new Date(date), time, itemCode: item_code, itemName: item_name, category, quantity: parseInt(quantity), handoverTo: handover_to, staffId: staff_id || null, purpose, remarks }
    });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteStockOut = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.stockOut.delete({ where: { id } });
    res.json({ success: true, message: 'Stock Out deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getStockOut, createStockOut, updateStockOut, deleteStockOut };
