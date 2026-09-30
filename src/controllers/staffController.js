const prisma = require('../config/supabase');

const getStaff = async (req, res) => {
  try {
    const data = await prisma.staff.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createStaff = async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ success: false, message: 'Name and type required' });
  try {
    const data = await prisma.staff.create({ data: { name: name.trim(), type } });
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;
  try {
    const data = await prisma.staff.update({ where: { id }, data: { name: name.trim(), type } });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.staff.delete({ where: { id } });
    res.json({ success: true, message: 'Staff deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff };
