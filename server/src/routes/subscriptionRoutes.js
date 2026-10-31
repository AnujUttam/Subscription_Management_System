const express = require('express');
const router = express.Router();
const {
  createSubscription,
  listSubscriptions,
  getSubscription,
  updateSubscription
} = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/auth');

// All subscription routes require JWT authentication and Admin/Staff role
router.use(protect, authorize('admin', 'staff'));

router.post('/', createSubscription);
router.get('/', listSubscriptions);
router.get('/:id', getSubscription);
router.patch('/:id', updateSubscription);

module.exports = router;
