const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

// GET /api/dashboard/summary
const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();

    // 1. Total active subscriptions
    const activeSubscriptionsPromise = Subscription.countDocuments({ status: 'active' });

    // 2. Total collected revenue based on recorded payments
    const collectedRevenuePromise = Payment.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    // 3. Total outstanding amount from unpaid invoices
    const outstandingAmountPromise = Invoice.aggregate([
      {
        $match: {
          status: { $ne: 'paid' },
          outstandingAmount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$outstandingAmount' }
        }
      }
    ]);

    // 4. Total overdue invoices: unpaid and dueAt < now and outstandingAmount > 0
    const overdueInvoicesPromise = Invoice.countDocuments({
      status: { $ne: 'paid' },
      outstandingAmount: { $gt: 0 },
      dueAt: { $lt: now }
    });

    const [
      activeSubscriptions,
      collectedRevenueResult,
      outstandingAmountResult,
      overdueInvoices
    ] = await Promise.all([
      activeSubscriptionsPromise,
      collectedRevenuePromise,
      outstandingAmountPromise,
      overdueInvoicesPromise
    ]);

    const totalCollectedRevenue = collectedRevenueResult[0]?.totalRevenue || 0;
    const totalOutstandingAmount = outstandingAmountResult[0]?.totalOutstanding || 0;

    return res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully.',
      data: {
        activeSubscriptions,
        totalCollectedRevenue, // integer paise
        totalOutstandingAmount, // integer paise
        overdueInvoices
      }
    });
  } catch (error) {
    console.error('[DashboardController.getDashboardSummary]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve dashboard summary' }
    });
  }
};

module.exports = {
  getDashboardSummary
};
