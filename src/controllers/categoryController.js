const prisma = require('../config/supabase');

const getCategories = async (req, res) => {
  try {
    const data = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createCategory = async (req, res) => {
  const { name, prefix } = req.body;
  if (!name || !prefix) return res.status(400).json({ success: false, message: 'Name and prefix required' });
  try {
    const data = await prisma.category.create({ data: { name: name.trim(), prefix: prefix.trim().toUpperCase() } });
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, prefix } = req.body;
  try {
    const oldCat = await prisma.category.findUnique({ where: { id } });
    if (!oldCat) return res.status(404).json({ success: false, message: 'Not found' });

    const newPrefix = prefix.trim().toUpperCase();
    const newName = name.trim();

    // If prefix is changed, cascade to all items and child tables
    if (oldCat.prefix !== newPrefix) {
      const items = await prisma.item.findMany({ where: { categoryName: oldCat.name } });
      for (const item of items) {
        if (item.itemCode.startsWith(oldCat.prefix + '-')) {
          const newItemCode = newPrefix + '-' + item.itemCode.substring(oldCat.prefix.length + 1);
          
          // Update child tables first to avoid FK constraint errors
          await prisma.$executeRaw`UPDATE "stock_out" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
          await prisma.$executeRaw`UPDATE "stock_in" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
          await prisma.$executeRaw`UPDATE "kit_items" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
          await prisma.$executeRaw`UPDATE "requisition_items" SET "item_code" = ${newItemCode} WHERE "item_code" = ${item.itemCode};`;
          
          // Then update the item
          await prisma.$executeRaw`UPDATE "items" SET "item_code" = ${newItemCode} WHERE "id" = ${item.id}::uuid;`;
        }
      }
    }

    const data = await prisma.category.update({
      where: { id },
      data: { name: newName, prefix: newPrefix }
    });
    res.json({ success: true, data });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: err.message }); 
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
