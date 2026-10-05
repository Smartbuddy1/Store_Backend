const prisma = require('../config/supabase');

const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const VALID_TYPES = ['Staff', 'Helper', 'Supplier', 'Other'];

const getStaff = async (req, res) => {
  try {
    const data = await prisma.staff.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createStaff = async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ success: false, message: 'Name and type required' });
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
  try {
    const data = await prisma.staff.create({ data: { name: name.trim(), type } });
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;
  try {
    const oldStaff = await prisma.staff.findUnique({ where: { id } });
    if (!oldStaff) return res.status(404).json({ success: false, message: 'Staff not found' });

    const newName = name.trim();
    const data = await prisma.staff.update({ where: { id }, data: { name: newName, type } });

    // Cascade name update to related logs that store name as string
    if (oldStaff.name !== newName) {
      // Update ToolLogs
      await prisma.toolLog.updateMany({
        where: { helperName: oldStaff.name },
        data: { helperName: newName }
      });

      // Update StockOuts (handoverTo)
      await prisma.stockOut.updateMany({
        where: { handoverTo: oldStaff.name },
        data: { handoverTo: newName }
      });
    }

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
