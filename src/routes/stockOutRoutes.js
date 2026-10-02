const express = require('express');
const router = express.Router();
const { getStockOut, getStockOutPaginated, createStockOut, updateStockOut, deleteStockOut } = require('../controllers/stockOutController');

router.get('/paginated', getStockOutPaginated);
router.get('/', getStockOut);
router.post('/', createStockOut);
router.put('/:id', updateStockOut);
router.delete('/:id', deleteStockOut);

module.exports = router;
