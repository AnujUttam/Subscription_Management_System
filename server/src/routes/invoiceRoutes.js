const express = require('express');
const router = express.Router();
const { listInvoices, getInvoice } = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/auth');

// All invoice routes require JWT and Admin/Staff role
router.use(protect, authorize('admin', 'staff'));

router.get('/', listInvoices);
router.get('/:id', getInvoice);

module.exports = router;
