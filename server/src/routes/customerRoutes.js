const express = require('express');
const router = express.Router();
const { listCustomers, createCustomer, getCustomer } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'staff'));

router.get('/', listCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomer);

module.exports = router;
