const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    additionalPrice: { type: Number, required: true, min: [0, 'Additional price cannot be negative'] } // integer paise
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    type: {
      type: String,
      trim: true,
      default: 'service'
    },
    salesPrice: {
      type: Number,
      required: [true, 'Sales price is required'],
      min: [0, 'Sales price cannot be negative']
      // integer paise — e.g. ₹1500 = 150000
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative']
      // integer paise
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    variants: {
      type: [variantSchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
  }
);

module.exports = mongoose.model('Product', productSchema);
