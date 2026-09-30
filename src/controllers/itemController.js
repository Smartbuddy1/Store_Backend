const prisma = require('../config/supabase');

const getItems = async (req, res) => {
  const { search, category } = req.query;
  try {
    const data = await prisma.item.findMany({
      where: {
        ...(category && { categoryName: category }),
        ...(search && {
          OR: [
            { itemName: { contains: search, mode: 'insensitive' } },
            { itemCode: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: { itemCode: 'asc' }
    });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getItemByCode = async (req, res) => {
  const { code } = req.params;
  try {
    const data = await prisma.item.findUnique({ where: { itemCode: code } });
    if (!data) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createItem = async (req, res) => {
  const { item_code, item_name, category, unit, minimum_stock, description } = req.body;
  if (!item_code || !item_name || !category) {
    return res.status(400).json({ success: false, message: 'item_code, item_name, category required' });
  }
  try {
    const data = await prisma.item.create({
      data: {
        itemCode: item_code.trim().toUpperCase(),
        itemName: item_name.trim(),
        categoryName: category,
        unit: unit || 'Nos',
        minimumStock: parseInt(minimum_stock) || 5,
        description: description || null
      }
    });
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateItem = async (req, res) => {
  const { id } = req.params;
  const { item_name, category, unit, minimum_stock, description } = req.body;
  try {
    const data = await prisma.item.update({
      where: { id },
      data: { itemName: item_name, categoryName: category, unit, minimumStock: parseInt(minimum_stock), description }
    });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.item.delete({ where: { id } });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getItems, getItemByCode, createItem, updateItem, deleteItem };
