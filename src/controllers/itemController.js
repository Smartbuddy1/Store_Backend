const prisma = require('../config/supabase');

// UUID validation helper
const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

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
      orderBy: { itemCode: 'asc' },
      select: {
        id: true,
        itemCode: true,
        itemName: true,
        categoryName: true,
        unit: true,
        minimumStock: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getItemsPaginated = async (req, res) => {
  const { search, category, page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  try {
    const where = {
      ...(category && { categoryName: category }),
      ...(search && {
        OR: [
          { itemName: { contains: search, mode: 'insensitive' } },
          { itemCode: { contains: search, mode: 'insensitive' } }
        ]
      })
    };
    
    const [data, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: { itemCode: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      }),
      prisma.item.count({ where })
    ]);
    
    res.json({ 
      success: true, 
      data: {
        records: data,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
      }
    });
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
  const { item_name, category, unit, minimum_stock, description } = req.body;
  let { item_code } = req.body;
  
  if (!item_name || !category) {
    return res.status(400).json({ success: false, message: 'item_name and category required' });
  }

  try {
    // Check for duplicate item name
    const existingItem = await prisma.item.findFirst({
      where: {
        itemName: {
          equals: item_name.trim(),
          mode: 'insensitive' // case-insensitive check
        }
      }
    });

    if (existingItem) {
      return res.status(400).json({ success: false, message: 'Duplicate data not allowed! This Item Name already exists.' });
    }

    // Generate item_code if not provided
    if (!item_code) {
      const catData = await prisma.category.findUnique({ where: { name: category } });
      if (!catData) return res.status(400).json({ success: false, message: 'Invalid category' });
      
      const allItemsInCategory = await prisma.item.findMany({
        where: { categoryName: category },
        select: { itemCode: true }
      });
      
      const maxNum = allItemsInCategory.reduce((max, item) => {
        const parts = item.itemCode.split('-');
        const num = parseInt(parts[1]) || 0;
        return num > max ? num : max;
      }, 0);
      
      item_code = `${catData.prefix}-${String(maxNum + 1).padStart(3, '0')}`;
    }

    const data = await prisma.item.create({
      data: {
        itemCode: item_code.trim().toUpperCase(),
        itemName: item_name.trim(),
        categoryName: category,
        unit: unit || 'Nos',
        minimumStock: parseInt(minimum_stock) || 5,
        description: description || null,
        photoUrl: req.body.photo_url || null
      }
    });
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateItem = async (req, res) => {
  const { id } = req.params;
  if (!isValidUUID(id)) return res.status(400).json({ success: false, message: 'Invalid item ID format' });
  const { item_name, category, unit, minimum_stock, description, photo_url } = req.body;
  if (!item_name || !category) return res.status(400).json({ success: false, message: 'item_name and category are required' });
  try {
    const currentItem = await prisma.item.findUnique({ where: { id } });
    if (!currentItem) return res.status(404).json({ success: false, message: 'Item not found' });

    // Check for duplicate item name (excluding current item)
    const existingItem = await prisma.item.findFirst({
      where: {
        itemName: {
          equals: item_name.trim(),
          mode: 'insensitive' // case-insensitive check
        },
        id: {
          not: id // Exclude current item
        }
      }
    });

    if (existingItem) {
      return res.status(400).json({ success: false, message: 'Duplicate data not allowed! This Item Name already exists.' });
    }

    let newItemCode = currentItem.itemCode;
    let oldCategory = currentItem.categoryName;
    let categoryChanged = false;

    if (oldCategory !== category) {
      categoryChanged = true;
      // Generate new item code for the new category
      const catData = await prisma.category.findUnique({ where: { name: category } });
      if (!catData) return res.status(400).json({ success: false, message: 'Invalid category' });
      
      const allItemsInCategory = await prisma.item.findMany({
        where: { categoryName: category },
        select: { itemCode: true }
      });
      
      const maxNum = allItemsInCategory.reduce((max, item) => {
        const parts = item.itemCode.split('-');
        const num = parseInt(parts[1]) || 0;
        return num > max ? num : max;
      }, 0);
      
      newItemCode = `${catData.prefix}-${String(maxNum + 1).padStart(3, '0')}`;
    }

    const data = await prisma.item.update({
      where: { id },
      data: { 
        itemCode: newItemCode,
        itemName: item_name, 
        categoryName: category, 
        unit, 
        minimumStock: parseInt(minimum_stock), 
        description,
        photoUrl: photo_url || null
      }
    });
    
    // Update itemName and category in historical records so UI stays consistent
    await prisma.stockIn.updateMany({
      where: { itemCode: data.itemCode },
      data: { itemName: item_name, category: category }
    });
    
    await prisma.stockOut.updateMany({
      where: { itemCode: data.itemCode },
      data: { itemName: item_name, category: category }
    });

    // If category changed, we must re-sequence the old category
    if (categoryChanged) {
      const codeParts = currentItem.itemCode.split('-');
      if (codeParts.length === 2) {
        const prefix = codeParts[0];
        const removedNum = parseInt(codeParts[1], 10);

        const higherItems = await prisma.item.findMany({
          where: { categoryName: oldCategory },
          orderBy: { itemCode: 'asc' }
        });

        for (const hItem of higherItems) {
          const hParts = hItem.itemCode.split('-');
          if (hParts.length === 2 && hParts[0] === prefix) {
            const num = parseInt(hParts[1], 10);
            if (num > removedNum) {
              const shiftedCode = `${prefix}-${String(num - 1).padStart(3, '0')}`;
              try {
                await prisma.item.update({
                  where: { id: hItem.id },
                  data: { itemCode: shiftedCode }
                });
              } catch (err) {
                if (err.code === 'P2003') { // Fallback if Cascade Update is missing
                  const tempItem = await prisma.item.create({
                    data: {
                      itemCode: shiftedCode,
                      itemName: hItem.itemName,
                      categoryName: hItem.categoryName,
                      unit: hItem.unit,
                      minimumStock: hItem.minimumStock,
                      description: hItem.description,
                      photoUrl: hItem.photoUrl
                    }
                  });
                  await prisma.$executeRawUnsafe(`UPDATE "stock_in" SET "item_code" = $1 WHERE "item_code" = $2`, shiftedCode, hItem.itemCode);
                  await prisma.$executeRawUnsafe(`UPDATE "stock_out" SET "item_code" = $1 WHERE "item_code" = $2`, shiftedCode, hItem.itemCode);
                  await prisma.$executeRawUnsafe(`UPDATE "kit_items" SET "item_code" = $1 WHERE "item_code" = $2`, shiftedCode, hItem.itemCode);
                  await prisma.$executeRawUnsafe(`UPDATE "requisition_items" SET "item_code" = $1 WHERE "item_code" = $2`, shiftedCode, hItem.itemCode);
                  await prisma.item.delete({ where: { id: hItem.id } });
                } else {
                  console.error("Failed to resequence item:", err);
                }
              }
            }
          }
        }
      }
    }

    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    // Check for stock history to prevent foreign key errors
    const stockInCount = await prisma.stockIn.count({ where: { itemCode: item.itemCode } });
    const stockOutCount = await prisma.stockOut.count({ where: { itemCode: item.itemCode } });

    if (stockInCount > 0 || stockOutCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete this item because it has Stock In/Out history. Please delete the history first or just mark it as zero stock.' 
      });
    }

    const codeParts = item.itemCode.split('-');
    
    // Actually delete the item first
    await prisma.item.delete({ where: { id } });

    // Re-sequence items if it had a standard prefix-number format
    if (codeParts.length === 2) {
      const prefix = codeParts[0];
      const deletedNum = parseInt(codeParts[1], 10);

      const higherItems = await prisma.item.findMany({
        where: { categoryName: item.categoryName },
        orderBy: { itemCode: 'asc' }
      });

      for (const hItem of higherItems) {
        const hParts = hItem.itemCode.split('-');
        if (hParts.length === 2 && hParts[0] === prefix) {
          const num = parseInt(hParts[1], 10);
          if (num > deletedNum) {
            const newCode = `${prefix}-${String(num - 1).padStart(3, '0')}`;
            const oldCode = hItem.itemCode;
            
            try {
              await prisma.item.update({
                where: { id: hItem.id },
                data: { itemCode: newCode }
              });
            } catch (err) {
              if (err.code === 'P2003') { // Fallback if Cascade Update is missing
                const tempItem = await prisma.item.create({
                  data: {
                    itemCode: newCode,
                    itemName: hItem.itemName,
                    categoryName: hItem.categoryName,
                    unit: hItem.unit,
                    minimumStock: hItem.minimumStock,
                    description: hItem.description,
                    photoUrl: hItem.photoUrl
                  }
                });
                await prisma.$executeRawUnsafe(`UPDATE "stock_in" SET "item_code" = $1 WHERE "item_code" = $2`, newCode, oldCode);
                await prisma.$executeRawUnsafe(`UPDATE "stock_out" SET "item_code" = $1 WHERE "item_code" = $2`, newCode, oldCode);
                await prisma.$executeRawUnsafe(`UPDATE "kit_items" SET "item_code" = $1 WHERE "item_code" = $2`, newCode, oldCode);
                await prisma.$executeRawUnsafe(`UPDATE "requisition_items" SET "item_code" = $1 WHERE "item_code" = $2`, newCode, oldCode);
                await prisma.item.delete({ where: { id: hItem.id } });
              } else {
                throw err;
              }
            }
          }
        }
      }
    }

    res.json({ success: true, message: 'Item deleted and codes re-sequenced successfully' });
  } catch (err) { 
    if (err.code === 'P2003') {
      return res.status(400).json({ success: false, message: 'Cannot delete item because it has related stock records.' });
    }
    res.status(500).json({ success: false, message: err.message }); 
  }
};

module.exports = { getItems, getItemsPaginated, getItemByCode, createItem, updateItem, deleteItem };
