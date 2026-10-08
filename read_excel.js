const xlsx = require('xlsx');

try {
  const filePath = 'c:\\\\Users\\\\shiv\\\\Desktop\\\\Arya innovtech pvt ltd\\\\Store\\\\Dinesh_Nahire_Store_Management_1.xlsx';
  const workbook = xlsx.readFile(filePath);
  
  console.log('--- WORKBOOK STRUCTURE ---');
  console.log('Sheets:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== SHEET: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    
    // Get headers (first row)
    const range = xlsx.utils.decode_range(sheet['!ref']);
    const headers = [];
    for(let C = range.s.c; C <= range.e.c; ++C) {
      const cell = sheet[xlsx.utils.encode_cell({c:C, r:0})];
      headers.push(cell ? cell.v : `(Empty Col ${C})`);
    }
    console.log('Headers:', headers);
    
    // Get row count
    console.log('Total Rows:', range.e.r + 1);
  });
} catch(e) {
  console.error(e);
}
