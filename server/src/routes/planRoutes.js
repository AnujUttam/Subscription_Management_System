const express = require('express');
const router = express.Router();
const { listPlans, createPlan } = require('../controllers/planController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'staff'));

router.get('/', listPlans);
router.post('/', createPlan);

module.exports = router;
