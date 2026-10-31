const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0 // integer paise
    },
    amount: {
      type: Number,
      required: true,
      min: 0 // integer paise
    }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required']
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'Subscription reference is required']
    },
    billingPeriodStart: {
      type: Date,
      required: [true, 'Billing period start date is required']
    },
    billingPeriodEnd: {
      type: Date,
      required: [true, 'Billing period end date is required']
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    dueAt: {
      type: Date,
      required: [true, 'Due date is required']
    },
    lineItems: {
      type: [lineItemSchema],
      default: []
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: 0 // integer paise
    },
    taxRatePercent: {
      type: Number,
      default: 18,
      min: 0
    },
    taxAmount: {
      type: Number,
      required: [true, 'Tax amount is required'],
      min: 0 // integer paise
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0 // integer paise
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0 // integer paise
    },
    outstandingAmount: {
      type: Number,
      required: [true, 'Outstanding amount is required'],
      min: 0 // integer paise
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'paid'],
        message: '{VALUE} is not a valid invoice status'
      },
      default: 'confirmed'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Mandatory compound index to prevent duplicate billing
invoiceSchema.index(
  { subscriptionId: 1, billingPeriodStart: 1, billingPeriodEnd: 1 },
  { unique: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
