const express = require('express');
const router = express.Router();
const { runBilling } = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/auth');

// All billing routes require JWT and Admin/Staff role
router.use(protect, authorize('admin', 'staff'));

router.post('/run', runBilling);

module.exports = router;
