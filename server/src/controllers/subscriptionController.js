const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Customer = require('../models/Customer');
const Plan = require('../models/Plan');
const { calculateNextBillingDate } = require('../utils/billingDate');
const { createNotification } = require('../utils/notificationService');

// POST /api/subscriptions
const createSubscription = async (req, res) => {
  try {
    const { customerId, planId, quantity = 1, startDate } = req.body;

    // Validate ObjectIds
    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid customerId is required' }
      });
    }

    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid planId is required' }
      });
    }

    // Validate quantity integer and positive
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Quantity must be a positive integer' }
      });
    }

    // Check Customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' }
      });
    }

    // Check Plan exists and populated with product
    const plan = await Plan.findById(planId).populate('productId');
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Plan not found' }
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cannot subscribe to an inactive plan' }
      });
    }

    if (plan.productId && !plan.productId.isActive) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cannot subscribe to a plan with an inactive product' }
      });
    }

    // Validate minimum quantity
    if (parsedQuantity < plan.minimumQuantity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Quantity must be at least the plan minimum of ${plan.minimumQuantity}`
        }
      });
    }

    // Determine start date and next billing date
    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid startDate provided' }
      });
    }

    const nextBillingDate = calculateNextBillingDate(parsedStartDate, plan.billingInterval);

    // Create Subscription in draft status with price & interval snapshots
    const subscription = await Subscription.create({
      customerId: customer._id,
      planId: plan._id,
      quantity: parsedQuantity,
      unitPriceSnapshot: plan.price,
      billingIntervalSnapshot: plan.billingInterval,
      status: 'draft',
      startDate: parsedStartDate,
      nextBillingDate
    });

    const populated = await Subscription.findById(subscription._id)
      .populate('customerId', 'name email')
      .populate('planId', 'name billingInterval price');

    createNotification({
      title: 'Subscription Created',
      message: `New ${plan.name} subscription created for ${customer.name}.`,
      type: 'subscription',
      level: 'success',
      link: '/subscriptions',
      metadata: { subscriptionId: subscription._id.toString() }
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription created successfully in draft status.',
      data: { subscription: populated }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: messages }
      });
    }
    console.error('[SubscriptionController.createSubscription]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create subscription' }
    });
  }
};

// GET /api/subscriptions
const listSubscriptions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.customerId && mongoose.Types.ObjectId.isValid(req.query.customerId)) {
      filter.customerId = req.query.customerId;
    }

    const subscriptions = await Subscription.find(filter)
      .populate('customerId', 'name email')
      .populate('planId', 'name billingInterval price')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        subscriptions,
        total: subscriptions.length
      }
    });
  } catch (error) {
    console.error('[SubscriptionController.listSubscriptions]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve subscriptions' }
    });
  }
};

// GET /api/subscriptions/:id
const getSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid subscription ID format' }
      });
    }

    const subscription = await Subscription.findById(id)
      .populate('customerId', 'name email')
      .populate('planId', 'name billingInterval price');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Subscription not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: { subscription }
    });
  } catch (error) {
    console.error('[SubscriptionController.getSubscription]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve subscription' }
    });
  }
};

// PATCH /api/subscriptions/:id
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid subscription ID format' }
      });
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Subscription not found' }
      });
    }

    const { status } = req.body;

    if (status !== undefined) {
      // Allowed transitions: draft -> active, active -> closed
      const currentStatus = subscription.status;
      const isValidTransition =
        (currentStatus === 'draft' && status === 'active') ||
        (currentStatus === 'active' && status === 'closed');

      if (!isValidTransition) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Invalid status transition from '${currentStatus}' to '${status}'. Permitted transitions: draft -> active, active -> closed.`
          }
        });
      }

      subscription.status = status;
    }

    await subscription.save();

    const populated = await Subscription.findById(subscription._id)
      .populate('customerId', 'name email')
      .populate('planId', 'name billingInterval price');

    if (status === 'active') {
      createNotification({
        title: 'Subscription Activated',
        message: `Subscription for ${populated.customerId?.name || 'Customer'} is now active.`,
        type: 'subscription',
        level: 'success',
        link: '/subscriptions',
        metadata: { subscriptionId: subscription._id.toString() }
      });
    } else if (status === 'closed') {
      createNotification({
        title: 'Subscription Cancelled',
        message: `Subscription for ${populated.customerId?.name || 'Customer'} has been closed.`,
        type: 'subscription',
        level: 'warning',
        link: '/subscriptions',
        metadata: { subscriptionId: subscription._id.toString() }
      });
    }

    return res.status(200).json({
      success: true,
      message: `Subscription status updated to '${subscription.status}'.`,
      data: { subscription: populated }
    });
  } catch (error) {
    console.error('[SubscriptionController.updateSubscription]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update subscription' }
    });
  }
};

module.exports = {
  createSubscription,
  listSubscriptions,
  getSubscription,
  updateSubscription
};
