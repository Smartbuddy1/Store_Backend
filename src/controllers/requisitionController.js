const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createRequisition = async (req, res) => {
  try {
    const { type, kitName, kitMultiplier, exportFormat, items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Items array is required and cannot be empty.' });
    }

    const requisition = await prisma.requisition.create({
      data: {
        type,
        kitName: kitName || null,
        kitMultiplier: kitMultiplier || null,
        exportFormat,
        items: {
          create: items.map(item => ({
            itemCode: item.code,
            itemName: item.name,
            category: item.category,
            currentQty: item.currentQty,
            reqQty: item.reqQty
          }))
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json({ success: true, data: requisition });
  } catch (error) {
    console.error('Error creating requisition:', error);
    res.status(500).json({ success: false, message: 'Failed to create requisition history.' });
  }
};

const getRequisitions = async (req, res) => {
  try {
    const { type } = req.query; // 'REGULAR' or 'KIT'
    
    let whereClause = {};
    if (type) {
      whereClause.type = type;
    }

    const requisitions = await prisma.requisition.findMany({
      where: whereClause,
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({ success: true, data: requisitions });
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requisitions.' });
  }
};

const deleteRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    // Delete child items first, then the requisition
    await prisma.requisitionItem.deleteMany({ where: { requisitionId: id } });
    await prisma.requisition.delete({ where: { id } });
    res.json({ success: true, message: 'Requisition deleted successfully.' });
  } catch (error) {
    console.error('Error deleting requisition:', error);
    res.status(500).json({ success: false, message: 'Failed to delete requisition.' });
  }
};

module.exports = {
  createRequisition,
  getRequisitions,
  deleteRequisition
};
