const express = require('express');
const router = express.Router();
const { getStockIn, createStockIn, updateStockIn, deleteStockIn } = require('../controllers/stockInController');

router.get('/', getStockIn);
router.post('/', createStockIn);
router.put('/:id', updateStockIn);
router.delete('/:id', deleteStockIn);

module.exports = router;
