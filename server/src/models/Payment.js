const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice ID is required']
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required']
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be greater than zero'],
      validate: {
        validator: Number.isInteger,
        message: 'Payment amount must be an integer in paise'
      }
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'bank_transfer', 'credit_card', 'demo'],
        message: '{VALUE} is not a valid payment method'
      },
      default: 'demo'
    },
    transactionReference: {
      type: String,
      trim: true,
      default: ''
    },
    paidAt: {
      type: Date,
      default: Date.now
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

paymentSchema.index({ invoiceId: 1 });
paymentSchema.index({ customerId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
