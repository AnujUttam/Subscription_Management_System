const Plan = require('../models/Plan');
const Product = require('../models/Product');

// GET /api/plans
const listPlans = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.productId) {
      filter.productId = req.query.productId;
    }

    const plans = await Plan.find(filter)
      .populate('productId', 'name type salesPrice isActive')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { plans, total: plans.length }
    });
  } catch (error) {
    console.error('[PlanController.listPlans]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve plans.' }
    });
  }
};

// POST /api/plans
const createPlan = async (req, res) => {
  try {
    const { name, productId, billingInterval, price, minimumQuantity } = req.body;

    if (!name || !productId || !billingInterval || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, productId, billingInterval, and price are required.'
        }
      });
    }

    if (!Number.isInteger(price) || price < 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'price must be a non-negative integer (paise).' }
      });
    }

    // Verify referenced product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Referenced product not found.' }
      });
    }
    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cannot create a plan for an inactive product.' }
      });
    }

    const plan = await Plan.create({ name, productId, billingInterval, price, minimumQuantity });
    const populated = await plan.populate('productId', 'name type salesPrice isActive');

    return res.status(201).json({
      success: true,
      message: 'Plan created successfully.',
      data: { plan: populated }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: messages }
      });
    }
    console.error('[PlanController.createPlan]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create plan.' }
    });
  }
};

module.exports = { listPlans, createPlan };
