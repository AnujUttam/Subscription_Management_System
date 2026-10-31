const mongoose = require('mongoose');
const Customer = require('../models/Customer');

// GET /api/customers
const listCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: { customers, total: customers.length }
    });
  } catch (error) {
    console.error('[CustomerController.listCustomers]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve customers.' }
    });
  }
};

// POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name and email are required.' }
      });
    }

    const customer = await Customer.create({ name, email, phone, company, address });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: { customer }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: 'A customer with this email already exists.' }
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: messages }
      });
    }
    console.error('[CustomerController.createCustomer]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create customer.' }
    });
  }
};

// GET /api/customers/:id
const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid customer ID format' }
      });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found.' }
      });
    }
    return res.status(200).json({ success: true, data: { customer } });
  } catch (error) {
    console.error('[CustomerController.getCustomer]', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve customer.' }
    });
  }
};

module.exports = { listCustomers, createCustomer, getCustomer };
