const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

// POST /api/payments
const recordPayment = async (req, res) => {
  const { invoiceId, paymentMethod = 'demo', transactionReference = '' } = req.body;

  // Validate ObjectId
  if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Valid invoiceId is required' }
    });
  }

  // Start MongoDB multi-document ACID transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch and validate invoice within transaction
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' }
      });
    }

    if (invoice.status === 'paid' || invoice.outstandingAmount <= 0) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVOICE_ALREADY_PAID',
          message: 'Invoice is already fully paid or has zero outstanding balance'
        }
      });
    }

    const paymentAmount = invoice.outstandingAmount;

    // 2. Atomic invoice update inside transaction with concurrency guard:
    // Ensures invoice is not concurrently paid or modified
    const updatedInvoice = await Invoice.findOneAndUpdate(
      {
        _id: invoice._id,
        status: { $ne: 'paid' },
        outstandingAmount: { $gte: paymentAmount }
      },
      {
        $inc: { paidAmount: paymentAmount },
        $set: {
          outstandingAmount: 0,
          status: 'paid'
        }
      },
      { new: true, session }
    );

    if (!updatedInvoice) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(409).json({
        success: false,
        error: {
          code: 'PAYMENT_CONFLICT',
          message: 'Payment cannot be processed. Invoice was already paid or modified concurrently.'
        }
      });
    }

    // 3. Create Payment document inside the same transaction
    const [createdPayment] = await Payment.create(
      [
        {
          invoiceId: invoice._id,
          customerId: invoice.customerId,
          amount: paymentAmount,
          paymentMethod,
          transactionReference,
          paidAt: new Date()
        }
      ],
      { session }
    );

    // Commit both operations together atomically
    await session.commitTransaction();
    await session.endSession();

    // Populate for clean client presentation
    const populatedPayment = await Payment.findById(createdPayment._id)
      .populate('invoiceId', 'invoiceNumber totalAmount paidAmount outstandingAmount status')
      .populate('customerId', 'name email company');

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully. Invoice marked as paid.',
      data: {
        payment: populatedPayment,
        invoice: {
          id: updatedInvoice._id,
          invoiceNumber: updatedInvoice.invoiceNumber,
          totalAmount: updatedInvoice.totalAmount,
          paidAmount: updatedInvoice.paidAmount,
          outstandingAmount: updatedInvoice.outstandingAmount,
          status: updatedInvoice.status
        }
      }
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();

    // Handle WriteConflict in concurrent transactions gracefully
    if (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'PAYMENT_CONFLICT',
          message: 'Concurrent transaction conflict. Please retry.'
        }
      });
    }

    console.error('[PaymentController.recordPayment]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to record payment' }
    });
  }
};

// GET /api/payments
const listPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.invoiceId && mongoose.Types.ObjectId.isValid(req.query.invoiceId)) {
      filter.invoiceId = req.query.invoiceId;
    }
    if (req.query.customerId && mongoose.Types.ObjectId.isValid(req.query.customerId)) {
      filter.customerId = req.query.customerId;
    }
    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod;
    }

    const payments = await Payment.find(filter)
      .populate('invoiceId', 'invoiceNumber totalAmount paidAmount outstandingAmount status')
      .populate('customerId', 'name email company')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        payments,
        total: payments.length
      }
    });
  } catch (error) {
    console.error('[PaymentController.listPayments]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve payments' }
    });
  }
};

// GET /api/payments/:id
const getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid payment ID format' }
      });
    }

    const payment = await Payment.findById(id)
      .populate('invoiceId', 'invoiceNumber billingPeriodStart billingPeriodEnd totalAmount paidAmount outstandingAmount status')
      .populate('customerId', 'name email company phone address');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payment record not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    console.error('[PaymentController.getPayment]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve payment record' }
    });
  }
};

module.exports = {
  recordPayment,
  listPayments,
  getPayment
};
