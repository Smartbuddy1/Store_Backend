const prisma = require('../config/supabase');

const getUnits = async (req, res) => {
  try {
    let units = await prisma.unit.findMany({ orderBy: { name: 'asc' } });
    if (!units || units.length === 0) {
      const defaultUnits = ['Nos', 'Kgs', 'Ltr'];
      for (const u of defaultUnits) {
        await prisma.unit.upsert({
          where: { name: u },
          update: {},
          create: { name: u }
        }).catch(() => {});
      }
      units = await prisma.unit.findMany({ orderBy: { name: 'asc' } });
    }
    res.json({ success: true, data: units });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createUnit = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Unit name is required' });
  }
  const trimmed = name.trim();
  try {
    const existing = await prisma.unit.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Unit already exists' });
    }
    const data = await prisma.unit.create({ data: { name: trimmed } });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteUnit = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.unit.delete({ where: { id } });
    res.json({ success: true, message: 'Unit deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUnits, createUnit, deleteUnit };

