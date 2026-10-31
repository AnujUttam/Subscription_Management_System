const express = require('express');
const router = express.Router();
const { recordPayment, listPayments, getPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// All payment routes require JWT and Admin/Staff role
router.use(protect, authorize('admin', 'staff'));

router.post('/', recordPayment);
router.get('/', listPayments);
router.get('/:id', getPayment);

module.exports = router;
