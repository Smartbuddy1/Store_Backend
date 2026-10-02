const express = require('express');
const router = express.Router();
const { getStockIn, getStockInPaginated, createStockIn, updateStockIn, deleteStockIn } = require('../controllers/stockInController');

router.get('/paginated', getStockInPaginated);
router.get('/', getStockIn);
router.post('/', createStockIn);
router.put('/:id', updateStockIn);
router.delete('/:id', deleteStockIn);

module.exports = router;
