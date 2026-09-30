const express = require('express');
const router = express.Router();
const { getStockOut, createStockOut, updateStockOut, deleteStockOut } = require('../controllers/stockOutController');

router.get('/', getStockOut);
router.post('/', createStockOut);
router.put('/:id', updateStockOut);
router.delete('/:id', deleteStockOut);

module.exports = router;
