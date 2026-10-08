const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const filePath = 'c:\\\\Users\\\\shiv\\\\Desktop\\\\Arya innovtech pvt ltd\\\\Store\\\\Dinesh_Nahire_Store_Management_1.xlsx';
  console.log(`Reading Excel file: ${filePath}`);
  
  // cellDates: true makes sure dates are parsed as JS Date objects
  const workbook = xlsx.readFile(filePath, { cellDates: true });

  // --- 1. CATEGORIES & ITEM MASTER ---
  console.log('Processing ITEM MASTER...');
  const itemMasterSheet = workbook.Sheets['2. ITEM MASTER'];
  const itemsData = xlsx.utils.sheet_to_json(itemMasterSheet);

  const categoriesSet = new Set();
  itemsData.forEach(row => {
    if (row['Category']) {
      categoriesSet.add(row['Category'].trim());
    }
  });

  // Create Categories
  console.log(`Found ${categoriesSet.size} unique categories.`);
  for (const catName of categoriesSet) {
    if (!catName) continue;
    let cat = await prisma.category.findUnique({ where: { name: catName } });
    if (!cat) {
      let basePrefix = catName.substring(0, 3).toUpperCase();
      let prefix = basePrefix;
      let counter = 1;
      while (true) {
        const existing = await prisma.category.findFirst({ where: { prefix } });
        if (!existing) break;
        prefix = basePrefix.substring(0, 2) + counter.toString();
        counter++;
      }
      
      await prisma.category.create({
        data: {
          name: catName,
          prefix: prefix
        }
      });
      console.log(`Created Category: ${catName} with prefix ${prefix}`);
    }
  }

  // Ensure Uncategorized category exists
  let uncategorizedCat = await prisma.category.findUnique({ where: { name: 'Uncategorized' } });
  if (!uncategorizedCat) {
    await prisma.category.create({
      data: { name: 'Uncategorized', prefix: 'UNC' }
    });
  }

  // Create Items
  let itemsCreated = 0;
  for (const row of itemsData) {
    const itemCode = (row['Item Code'] || '').toString().trim();
    if (!itemCode) continue;

    let item = await prisma.item.findUnique({ where: { itemCode } });
    if (!item) {
      let cName = (row['Category'] || '').toString().trim();
      if (!cName) cName = 'Uncategorized';

      let iName = (row['Item Name'] || '').toString().trim();
      if (!iName) iName = 'Unknown Item';

      await prisma.item.create({
        data: {
          itemCode,
          itemName: iName,
          categoryName: cName,
          minimumStock: parseFloat(row['Minimum Stock']) || 5,
        }
      });
      itemsCreated++;
    }
  }
  console.log(`Created ${itemsCreated} new items.`);

  // --- 2. STOCK IN ---
  console.log('Processing STOCK IN...');
  const stockInSheet = workbook.Sheets['3. STOCK IN'];
  const stockInData = xlsx.utils.sheet_to_json(stockInSheet);

  let stockInsCreated = 0;
  for (const row of stockInData) {
    const itemCode = (row['Item Code'] || '').toString().trim();
    if (!itemCode) continue;

    let date = row['Date'];
    if (typeof date === 'string') {
      date = new Date(date);
    } else if (typeof date === 'number') {
      // Sometimes it parses differently if cellDates: true doesn't apply to everything
      date = new Date(Math.round((date - 25569)*86400*1000));
    }
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      date = new Date(); // fallback
    }

    const qty = parseFloat(row['Quantity Added']);
    if (isNaN(qty)) continue;

    await prisma.stockIn.create({
      data: {
        date: date,
        time: "00:00",
        itemCode: itemCode,
        itemName: (row['Item Name (Auto)'] || row['Item Name'] || '').toString().trim(),
        category: (row['Category (Auto)'] || row['Category'] || '').toString().trim() || null,
        quantity: qty,
        source: (row['Handover From'] || 'Supplier').toString().trim(),
      }
    });
    stockInsCreated++;
  }
  console.log(`Created ${stockInsCreated} Stock In records.`);

  // --- 3. STOCK OUT ---
  console.log('Processing STOCK OUT...');
  const stockOutSheet = workbook.Sheets['4.STOCK OUT'];
  const stockOutData = xlsx.utils.sheet_to_json(stockOutSheet);

  let stockOutsCreated = 0;
  for (const row of stockOutData) {
    const itemCode = (row['Item Code'] || '').toString().trim();
    if (!itemCode) continue;

    let date = row['Date'];
    if (typeof date === 'string') {
      date = new Date(date);
    } else if (typeof date === 'number') {
      date = new Date(Math.round((date - 25569)*86400*1000));
    }
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      date = new Date(); // fallback
    }

    const qty = parseFloat(row['Quantity Taken']);
    if (isNaN(qty)) continue;

    await prisma.stockOut.create({
      data: {
        date: date,
        time: "00:00",
        itemCode: itemCode,
        itemName: (row['Item Name (Auto)'] || row['Item Name'] || '').toString().trim(),
        category: (row['Category (Auto)'] || row['Category'] || '').toString().trim() || null,
        quantity: qty,
        handoverTo: (row['Handover To'] || '').toString().trim(),
      }
    });
    stockOutsCreated++;
  }
  console.log(`Created ${stockOutsCreated} Stock Out records.`);

  console.log('--- ALL DATA IMPORTED SUCCESSFULLY ---');
}

main()
  .catch(e => {
    console.error('Error during import:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
