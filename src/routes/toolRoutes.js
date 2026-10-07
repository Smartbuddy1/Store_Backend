const express = require('express');
const router = express.Router();
const toolController = require('../controllers/toolController');

// Tool Logs (must be before /:id wildcard)
router.get('/logs', toolController.getAllLogs);
router.post('/issue', toolController.issueTool);
router.put('/return/:id', toolController.returnTool);
router.put('/logs/:id', toolController.updateLog);
router.delete('/logs/:id', toolController.deleteLog);

// Master Tools
router.get('/', toolController.getAllTools);
router.post('/', toolController.createTool);
router.put('/:id', toolController.updateTool);
router.delete('/:id', toolController.deleteTool);

module.exports = router;
