const express = require('express');
const router = express.Router();
const toolController = require('../controllers/toolController');

// Master Tools
router.get('/', toolController.getAllTools);
router.post('/', toolController.createTool);
router.delete('/:id', toolController.deleteTool);

// Tool Logs
router.get('/logs', toolController.getAllLogs);
router.post('/issue', toolController.issueTool);
router.put('/return/:id', toolController.returnTool);

module.exports = router;
