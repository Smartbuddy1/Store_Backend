const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
  { id: '1', mobile: '8010209983', name: 'Mr. Akshay Shelke', role: 'Store_Incharge' },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);

async function run() {
  try {
    const [dash, stockIn, stockOut] = await Promise.all([
      fetch('http://localhost:5001/api/current-stock/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch('http://localhost:5001/api/stock-in/paginated?page=1&limit=10', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch('http://localhost:5001/api/stock-out/paginated?page=1&limit=10', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
    ]);
    console.log('dash success:', dash.success);
    console.log('stockIn success:', stockIn.success, 'records:', stockIn.data?.records?.length);
    console.log('stockOut success:', stockOut.success, 'records:', stockOut.data?.records?.length);
  } catch (e) {
    console.error('API Error:', e);
  }
}
run();
