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
      include: {
        item: { select: { photoUrl: true } }
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    });

    const formattedData = data.map(record => ({
      ...record,
      photoUrl: record.item?.photoUrl || null
    }));

    res.json({ success: true, data: formattedData });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getStockOutPaginated = async (req, res) => {
  const { search, category, handover_to, from_date, to_date, page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    const where = {
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
    };

    const [data, total] = await Promise.all([
      prisma.stockOut.findMany({
        where,
        include: { item: { select: { photoUrl: true } } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      }),
      prisma.stockOut.count({ where })
    ]);

    const formattedData = data.map(record => ({
      ...record,
      photoUrl: record.item?.photoUrl || null
    }));

    res.json({ 
      success: true, 
      data: {
        records: formattedData,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createStockOut = async (req, res) => {
  const { date, time, item_code, item_name, category, quantity, handover_to, staff_id, purpose, remarks } = req.body;
  if (!date || !time || !item_code || !item_name || !quantity) {
    return res.status(400).json({ success: false, message: 'date, time, item_code, item_name, quantity required' });
  }
  
  try {
    const parsedQuantity = parseFloat(quantity);
    
    // Validate current stock
    const totalIn = await prisma.stockIn.aggregate({ where: { itemCode: item_code }, _sum: { quantity: true } });
    const totalOut = await prisma.stockOut.aggregate({ where: { itemCode: item_code }, _sum: { quantity: true } });
    const currentQty = (totalIn._sum.quantity || 0) - (totalOut._sum.quantity || 0);

    if (parsedQuantity > currentQty) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${currentQty}` });
    }

    const data = await prisma.stockOut.create({
      data: {
        date: new Date(date),
        time,
        itemCode: item_code,
        itemName: item_name,
        category: category || null,
        quantity: parsedQuantity,
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
    const parsedQuantity = parseFloat(quantity);
    
    const oldRecord = await prisma.stockOut.findUnique({ where: { id } });
    if (!oldRecord) return res.status(404).json({ success: false, message: 'Record not found' });
    
    // Validate current stock for the new item code
    const totalIn = await prisma.stockIn.aggregate({ where: { itemCode: item_code }, _sum: { quantity: true } });
    const totalOut = await prisma.stockOut.aggregate({ where: { itemCode: item_code }, _sum: { quantity: true } });
    
    // If updating the same item, add back the old quantity to available stock
    const currentQty = (totalIn._sum.quantity || 0) - (totalOut._sum.quantity || 0) + (oldRecord.itemCode === item_code ? oldRecord.quantity : 0);

    if (parsedQuantity > currentQty) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${currentQty}` });
    }

    const data = await prisma.stockOut.update({
      where: { id },
      data: { date: new Date(date), time, itemCode: item_code, itemName: item_name, category, quantity: parsedQuantity, handoverTo: handover_to, staffId: staff_id || null, purpose, remarks }
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

module.exports = { getStockOut, getStockOutPaginated, createStockOut, updateStockOut, deleteStockOut };
