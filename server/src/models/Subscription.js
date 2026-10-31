const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required']
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan ID is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer'
      }
    },
    unitPriceSnapshot: {
      type: Number,
      required: [true, 'Unit price snapshot is required'],
      min: [0, 'Unit price cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Unit price snapshot must be an integer in paise'
      }
    },
    billingIntervalSnapshot: {
      type: String,
      enum: {
        values: ['daily', 'weekly', 'monthly', 'yearly'],
        message: '{VALUE} is not a valid billing interval'
      },
      required: [true, 'Billing interval snapshot is required']
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'closed'],
        message: '{VALUE} is not a valid subscription status'
      },
      default: 'draft'
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now
    },
    nextBillingDate: {
      type: Date,
      required: [true, 'Next billing date is required']
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

module.exports = mongoose.model('Subscription', subscriptionSchema);
