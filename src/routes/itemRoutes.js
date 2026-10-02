const express = require('express');
const router = express.Router();
const { getItems, getItemsPaginated, getItemByCode, createItem, updateItem, deleteItem } = require('../controllers/itemController');

router.get('/paginated', getItemsPaginated);
router.get('/', getItems);
router.get('/:code', getItemByCode);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
