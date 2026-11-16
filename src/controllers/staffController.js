const prisma = require('../config/supabase');

const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const getStaffRoles = async (req, res) => {
  try {
    let roles = await prisma.staffRole.findMany({ orderBy: { name: 'asc' } });
    if (!roles || roles.length === 0) {
      // Seed default roles if none exist
      const defaultRoles = ['Staff', 'Helper', 'Other'];
      for (const r of defaultRoles) {
        await prisma.staffRole.upsert({
          where: { name: r },
          update: {},
          create: { name: r }
        }).catch(() => {});
      }
      roles = await prisma.staffRole.findMany({ orderBy: { name: 'asc' } });
    }
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createStaffRole = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Role name is required' });
  }
  const trimmed = name.trim();
  try {
    const existing = await prisma.staffRole.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Role already exists' });
    }
    const data = await prisma.staffRole.create({ data: { name: trimmed } });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStaff = async (req, res) => {
  try {
    const data = await prisma.staff.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createStaff = async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ success: false, message: 'Name and type required' });
  const trimmedType = type.trim();
  try {
    // Automatically ensure role is recorded in staff_roles
    await prisma.staffRole.upsert({
      where: { name: trimmedType },
      update: {},
      create: { name: trimmedType }
    }).catch(() => {});

    const data = await prisma.staff.create({ data: { name: name.trim(), type: trimmedType } });
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;
  try {
    const oldStaff = await prisma.staff.findUnique({ where: { id } });
    if (!oldStaff) return res.status(404).json({ success: false, message: 'Staff not found' });

    const newName = name ? name.trim() : oldStaff.name;
    const newType = type ? type.trim() : oldStaff.type;

    if (newType) {
      await prisma.staffRole.upsert({
        where: { name: newType },
        update: {},
        create: { name: newType }
      }).catch(() => {});
    }

    const data = await prisma.staff.update({ where: { id }, data: { name: newName, type: newType } });

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

module.exports = { getStaffRoles, createStaffRole, getStaff, createStaff, updateStaff, deleteStaff };
