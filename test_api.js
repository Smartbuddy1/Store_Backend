fetch('http://localhost:5000/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    item_code: 'EX-004',
    item_name: 'test API',
    category: 'Electronic',
    unit: 'nos',
    minimum_stock: 5
  })
}).then(r => r.json()).then(console.log).catch(console.error);
