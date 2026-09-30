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
    const data = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), prefix: prefix.trim().toUpperCase() }
    });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
