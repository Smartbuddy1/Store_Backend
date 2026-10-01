const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new Kit
exports.createKit = async (req, res) => {
  try {
    const { kitName, description, items } = req.body;
    // items should be an array of { itemCode, quantity }

    const kit = await prisma.kit.create({
      data: {
        kitName,
        description,
        kitItems: {
          create: items.map(item => ({
            itemCode: item.itemCode,
            quantity: parseFloat(item.quantity),
            unit: item.unit || null
          }))
        }
      },
      include: {
        kitItems: {
          include: {
            item: true
          }
        }
      }
    });

    res.status(201).json({ success: true, data: kit });
  } catch (error) {
    console.error('Error creating kit:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all Kits
exports.getAllKits = async (req, res) => {
  try {
    const kits = await prisma.kit.findMany({
      include: {
        kitItems: {
          include: {
            item: true
          }
        }
      },
      orderBy: { kitName: 'asc' }
    });
    res.json({ success: true, data: kits });
  } catch (error) {
    console.error('Error fetching kits:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get a single Kit
exports.getKitById = async (req, res) => {
  try {
    const { id } = req.params;
    const kit = await prisma.kit.findUnique({
      where: { id },
      include: {
        kitItems: {
          include: {
            item: true
          }
        }
      }
    });

    if (!kit) {
      return res.status(404).json({ success: false, message: 'Kit not found' });
    }

    res.json({ success: true, data: kit });
  } catch (error) {
    console.error('Error fetching kit:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update a Kit
exports.updateKit = async (req, res) => {
  try {
    const { id } = req.params;
    const { kitName, description, items } = req.body;

    await prisma.kitItem.deleteMany({
      where: { kitId: id }
    });

    const kit = await prisma.kit.update({
      where: { id },
      data: {
        kitName,
        description,
        kitItems: {
          create: items.map(item => ({
            itemCode: item.itemCode,
            quantity: parseFloat(item.quantity),
            unit: item.unit || null
          }))
        }
      },
      include: {
        kitItems: {
          include: { item: true }
        }
      }
    });

    res.json({ success: true, data: kit });
  } catch (error) {
    console.error('Error updating kit:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete a Kit
exports.deleteKit = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.kit.delete({ where: { id } });
    res.json({ success: true, message: 'Kit deleted successfully' });
  } catch (error) {
    console.error('Error deleting kit:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
