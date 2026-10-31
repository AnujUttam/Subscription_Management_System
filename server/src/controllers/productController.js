const mongoose = require('mongoose');
const Product = require('../models/Product');

// GET /api/products
const listProducts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: { products, total: products.length }
    });
  } catch (error) {
    console.error('[ProductController.listProducts]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve products.' }
    });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const { name, type, salesPrice, costPrice, notes, variants } = req.body;

    if (!name || salesPrice === undefined || salesPrice === null) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name and salesPrice are required.' }
      });
    }

    if (!Number.isInteger(salesPrice) || salesPrice < 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'salesPrice must be a non-negative integer (paise).' }
      });
    }

    if (costPrice !== undefined && (!Number.isInteger(costPrice) || costPrice < 0)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'costPrice must be a non-negative integer (paise).' }
      });
    }

    const product = await Product.create({ name, type, salesPrice, costPrice, notes, variants });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: { product }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: messages }
      });
    }
    console.error('[ProductController.createProduct]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create product.' }
    });
  }
};

// PATCH /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid product ID format' }
      });
    }

    const allowed = ['name', 'type', 'salesPrice', 'costPrice', 'notes', 'variants', 'isActive'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.salesPrice !== undefined && (!Number.isInteger(updates.salesPrice) || updates.salesPrice < 0)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'salesPrice must be a non-negative integer (paise).' }
      });
    }

    if (updates.costPrice !== undefined && (!Number.isInteger(updates.costPrice) || updates.costPrice < 0)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'costPrice must be a non-negative integer (paise).' }
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: { product }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: messages }
      });
    }
    console.error('[ProductController.updateProduct]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update product.' }
    });
  }
};

module.exports = { listProducts, createProduct, updateProduct };
