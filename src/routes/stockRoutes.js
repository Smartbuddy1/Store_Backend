const express = require('express');
const router = express.Router();
const { getCurrentStock, getDashboardStats } = require('../controllers/stockController');

router.get('/', getCurrentStock);
router.get('/dashboard', getDashboardStats);

module.exports = router;
