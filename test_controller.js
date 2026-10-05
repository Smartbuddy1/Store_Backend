const { getCurrentStock } = require('./src/controllers/stockController');

getCurrentStock(
  { query: {} },
  { 
    json: (data) => console.log('Response JSON:', data),
    status: (code) => {
      console.log('Status:', code);
      return { json: (data) => console.log('Error JSON:', data) };
    }
  }
).catch(console.error);
