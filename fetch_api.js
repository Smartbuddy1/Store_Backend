const jwt = require('jsonwebtoken');
const token = jwt.sign({ mobile: '8010209983', name: 'Admin 1', role: 'Store_Incharge' }, 'AaryaInnovtech@StoreManagement#SecretKey2024!', { expiresIn: '1h' });

fetch('http://localhost:5001/api/current-stock', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(console.error);
