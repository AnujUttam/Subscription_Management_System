const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const { calculateNextBillingDate, calculatePreviousBillingDate } = require('../utils/billingDate');

/**
 * Generates an invoice number like INV-YYYYMMDD-XXXXX
 */
const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `INV-${dateStr}-${randomSuffix}`;
};

/**
 * Attempts invoice creation with retry on collision (up to 3 attempts)
 */
const createInvoiceWithRetry = async (invoiceData, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await Invoice.create(invoiceData);
    } catch (err) {
      // If code 11000 is on invoiceNumber, regenerate and retry
      if (err.code === 11000 && err.keyPattern && err.keyPattern.invoiceNumber) {
        invoiceData.invoiceNumber = generateInvoiceNumber();
        continue;
      }
      // Otherwise rethrow (e.g. compound index duplicate on subscription cycle)
      throw err;
    }
  }
  return await Invoice.create(invoiceData);
};

// POST /api/billing/run
const runBilling = async (req, res) => {
  try {
    const now = new Date();

    // 1. Find active subscriptions where nextBillingDate <= now
    const dueSubscriptions = await Subscription.find({
      status: 'active',
      nextBillingDate: { $lte: now }
    }).populate('planId customerId');

    let createdCount = 0;
    let skippedCount = 0;
    let recoveredCount = 0;
    let failedCount = 0;
    const invoiceResults = [];

    for (const sub of dueSubscriptions) {
      // Billing period definition:
      // billingPeriodEnd corresponds to the subscription's scheduled nextBillingDate
      const billingPeriodEnd = new Date(sub.nextBillingDate);
      
      // billingPeriodStart is one cycle interval before nextBillingDate
      const calculatedStart = calculatePreviousBillingDate(billingPeriodEnd, sub.billingIntervalSnapshot);
      // Ensure period start doesn't precede the subscription's start date
      const billingPeriodStart = calculatedStart < new Date(sub.startDate) 
        ? new Date(sub.startDate) 
        : calculatedStart;

      // Subtotal calculation in integer paise
      const unitPrice = sub.unitPriceSnapshot;
      const quantity = sub.quantity;
      const subtotal = unitPrice * quantity;

      // 18% tax calculation in integer paise with Math.round
      const taxRatePercent = 18;
      const taxAmount = Math.round((subtotal * taxRatePercent) / 100);
      const totalAmount = subtotal + taxAmount;
      const outstandingAmount = totalAmount;

      // Due date: 7 days after billingPeriodEnd
      const dueAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const planName = sub.planId ? sub.planId.name : 'Subscription Plan';
      const lineItems = [
        {
          description: `${planName} (${sub.billingIntervalSnapshot}) x ${quantity}`,
          quantity,
          unitPrice,
          amount: subtotal
        }
      ];

      const invoiceData = {
        invoiceNumber: generateInvoiceNumber(),
        customerId: sub.customerId._id || sub.customerId,
        subscriptionId: sub._id,
        billingPeriodStart,
        billingPeriodEnd,
        issuedAt: now,
        dueAt,
        lineItems,
        subtotal,
        taxRatePercent,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        outstandingAmount,
        status: 'confirmed'
      };

      try {
        const createdInvoice = await createInvoiceWithRetry(invoiceData);

        // Advance nextBillingDate ONLY after successful invoice creation
        const nextDate = calculateNextBillingDate(sub.nextBillingDate, sub.billingIntervalSnapshot);
        sub.nextBillingDate = nextDate;
        await sub.save();

        createdCount++;
        invoiceResults.push({
          subscriptionId: sub._id,
          invoiceNumber: createdInvoice.invoiceNumber,
          totalAmount: createdInvoice.totalAmount,
          status: 'created'
        });
      } catch (err) {
        // Duplicate-key error (code 11000) for compound index (subscriptionId + billingPeriodStart + billingPeriodEnd)
        if (err.code === 11000) {
          // Identify existing invoice for this subscription and billing period
          const existingInvoice = await Invoice.findOne({
            subscriptionId: sub._id,
            billingPeriodStart,
            billingPeriodEnd
          });

          if (existingInvoice) {
            // Verify that the existing invoice is valid and matches the cycle
            // Check if subscription's nextBillingDate needs to advance (i.e. retry recovery scenario)
            const currentSubNext = new Date(sub.nextBillingDate).getTime();
            const expectedEnd = new Date(billingPeriodEnd).getTime();

            if (currentSubNext === expectedEnd) {
              // Advance nextBillingDate to recover from previous failure
              const advancedDate = calculateNextBillingDate(sub.nextBillingDate, sub.billingIntervalSnapshot);
              sub.nextBillingDate = advancedDate;
              await sub.save();

              recoveredCount++;
              skippedCount++;
              invoiceResults.push({
                subscriptionId: sub._id,
                invoiceNumber: existingInvoice.invoiceNumber,
                status: 'recovered_and_skipped',
                reason: 'Existing invoice verified for billing cycle; recovered by advancing nextBillingDate without duplicate invoice'
              });
            } else {
              // Already advanced, pure skip
              skippedCount++;
              invoiceResults.push({
                subscriptionId: sub._id,
                invoiceNumber: existingInvoice.invoiceNumber,
                status: 'skipped',
                reason: 'Invoice for this subscription and billing period already exists'
              });
            }
          } else {
            // Duplicate was on another field (e.g. invoiceNumber collision after retries)
            failedCount++;
            invoiceResults.push({
              subscriptionId: sub._id,
              status: 'failed',
              reason: err.message
            });
          }
        } else {
          console.error(`[Billing] Failed to process subscription ${sub._id}:`, err.message);
          failedCount++;
          invoiceResults.push({
            subscriptionId: sub._id,
            status: 'failed',
            reason: err.message
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Billing run completed. Processed ${dueSubscriptions.length} due subscriptions.`,
      data: {
        totalDue: dueSubscriptions.length,
        createdCount,
        skippedCount,
        recoveredCount,
        failedCount,
        invoices: invoiceResults
      }
    });
  } catch (error) {
    console.error('[BillingController.runBilling]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to execute billing run' }
    });
  }
};

// GET /api/invoices
const listInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.customerId && mongoose.Types.ObjectId.isValid(req.query.customerId)) {
      filter.customerId = req.query.customerId;
    }
    if (req.query.subscriptionId && mongoose.Types.ObjectId.isValid(req.query.subscriptionId)) {
      filter.subscriptionId = req.query.subscriptionId;
    }

    const invoices = await Invoice.find(filter)
      .populate('customerId', 'name email company')
      .populate('subscriptionId', 'billingIntervalSnapshot unitPriceSnapshot quantity status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        invoices,
        total: invoices.length
      }
    });
  } catch (error) {
    console.error('[InvoiceController.listInvoices]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve invoices' }
    });
  }
};

// GET /api/invoices/:id
const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid invoice ID format' }
      });
    }

    const invoice = await Invoice.findById(id)
      .populate('customerId', 'name email company phone address')
      .populate('subscriptionId', 'billingIntervalSnapshot unitPriceSnapshot quantity status nextBillingDate');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    console.error('[InvoiceController.getInvoice]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve invoice' }
    });
  }
};

module.exports = {
  runBilling,
  listInvoices,
  getInvoice
};
