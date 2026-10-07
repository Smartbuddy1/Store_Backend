const express = require('express');
const router = express.Router();
const requisitionController = require('../controllers/requisitionController');

router.post('/', requisitionController.createRequisition);
router.get('/', requisitionController.getRequisitions);
router.delete('/:id', requisitionController.deleteRequisition);

module.exports = router;
