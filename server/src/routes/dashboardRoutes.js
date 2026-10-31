const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// Dashboard summary requires JWT and Admin/Staff role
router.use(protect, authorize('admin', 'staff'));

router.get('/summary', getDashboardSummary);

module.exports = router;
