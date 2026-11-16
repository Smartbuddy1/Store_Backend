const express = require('express');
const router = express.Router();
const { getStaffRoles, createStaffRole, getStaff, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');

router.get('/roles', getStaffRoles);
router.post('/roles', createStaffRole);
router.get('/', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
