const prisma = require('../config/supabase');

const ensureUnitsTable = async () => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    // ignore error if table exists
  }
};

const getUnits = async (req, res) => {
  try {
    if (prisma.unit) {
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
      return res.json({ success: true, data: units });
    }

    // Fallback using raw SQL when prisma.unit model is not generated
    await ensureUnitsTable();
    let units = await prisma.$queryRawUnsafe(`SELECT * FROM units ORDER BY name ASC`);
    if (!units || units.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO units (name) VALUES ('Nos'), ('Kgs'), ('Ltr') ON CONFLICT (name) DO NOTHING;
      `).catch(() => {});
      units = await prisma.$queryRawUnsafe(`SELECT * FROM units ORDER BY name ASC`);
    }
    return res.json({ success: true, data: units });
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
    if (prisma.unit) {
      const existing = await prisma.unit.findFirst({
        where: { name: { equals: trimmed, mode: 'insensitive' } }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Unit already exists' });
      }
      const data = await prisma.unit.create({ data: { name: trimmed } });
      return res.status(201).json({ success: true, data });
    }

    // Fallback using raw SQL
    await ensureUnitsTable();
    const existing = await prisma.$queryRawUnsafe(
      `SELECT * FROM units WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      trimmed
    );
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Unit already exists' });
    }
    const result = await prisma.$queryRawUnsafe(
      `INSERT INTO units (name) VALUES ($1) RETURNING *`,
      trimmed
    );
    return res.status(201).json({ success: true, data: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateUnit = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Unit name is required' });
  }
  const trimmed = name.trim();

  try {
    if (prisma.unit) {
      const currentUnit = await prisma.unit.findUnique({ where: { id } });
      if (!currentUnit) {
        return res.status(404).json({ success: false, message: 'Unit not found' });
      }

      // Check for duplicate name
      const existing = await prisma.unit.findFirst({
        where: {
          name: { equals: trimmed, mode: 'insensitive' },
          id: { not: id }
        }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Unit with this name already exists' });
      }

      const oldName = currentUnit.name;
      const data = await prisma.unit.update({
        where: { id },
        data: { name: trimmed }
      });

      // Cascade update to Item Master & Kit Items
      if (oldName !== trimmed) {
        if (prisma.item) {
          await prisma.item.updateMany({
            where: { unit: { equals: oldName, mode: 'insensitive' } },
            data: { unit: trimmed }
          }).catch(console.error);
        }
        if (prisma.kitItem) {
          await prisma.kitItem.updateMany({
            where: { unit: { equals: oldName, mode: 'insensitive' } },
            data: { unit: trimmed }
          }).catch(console.error);
        }
      }

      return res.json({ success: true, data });
    }

    // Fallback using raw SQL
    await ensureUnitsTable();
    const currentUnits = await prisma.$queryRawUnsafe(
      `SELECT * FROM units WHERE id = $1::uuid LIMIT 1`,
      id
    );
    if (!currentUnits || currentUnits.length === 0) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    const oldName = currentUnits[0].name;

    const existing = await prisma.$queryRawUnsafe(
      `SELECT * FROM units WHERE LOWER(name) = LOWER($1) AND id != $2::uuid LIMIT 1`,
      trimmed,
      id
    );
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Unit with this name already exists' });
    }

    const updated = await prisma.$queryRawUnsafe(
      `UPDATE units SET name = $1 WHERE id = $2::uuid RETURNING *`,
      trimmed,
      id
    );

    // Cascade update to items and kit_items
    if (oldName !== trimmed) {
      await prisma.$executeRawUnsafe(
        `UPDATE items SET unit = $1 WHERE LOWER(unit) = LOWER($2)`,
        trimmed,
        oldName
      ).catch(console.error);

      await prisma.$executeRawUnsafe(
        `UPDATE kit_items SET unit = $1 WHERE LOWER(unit) = LOWER($2)`,
        trimmed,
        oldName
      ).catch(console.error);
    }

    return res.json({ success: true, data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteUnit = async (req, res) => {
  const { id } = req.params;
  try {
    if (prisma.unit) {
      await prisma.unit.delete({ where: { id } });
      return res.json({ success: true, message: 'Unit deleted successfully' });
    }

    await ensureUnitsTable();
    await prisma.$executeRawUnsafe(`DELETE FROM units WHERE id = $1::uuid`, id);
    res.json({ success: true, message: 'Unit deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUnits, createUnit, updateUnit, deleteUnit };
