const express = require('express');
const router = express.Router();
const { getUnits, createUnit, updateUnit, deleteUnit } = require('../controllers/unitController');

router.get('/', getUnits);
router.post('/', createUnit);
router.put('/:id', updateUnit);
router.delete('/:id', deleteUnit);

module.exports = router;

