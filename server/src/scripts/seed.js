const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const connectDB = require('../config/db');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

const seedDatabase = async () => {
  console.log('[Seed] Starting idempotent demo seeding process...');

  const isConnected = await connectDB();
  if (!isConnected) {
    console.error('[Seed] Database connection failed. Aborting seed script.');
    process.exit(1);
  }

  try {
    // 1. Seed Demo Users (Admin and Staff)
    const demoUsers = [
      {
        name: 'Demo Admin',
        email: 'admin@brightloop.io',
        plainPassword: process.env.DEMO_ADMIN_PASSWORD || 'Admin@123',
        role: 'admin'
      },
      {
        name: 'Demo Staff',
        email: 'staff@brightloop.io',
        plainPassword: process.env.DEMO_STAFF_PASSWORD || 'Staff@123',
        role: 'staff'
      }
    ];

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.plainPassword, salt);

      if (existingUser) {
        existingUser.name = userData.name;
        existingUser.role = userData.role;
        existingUser.passwordHash = passwordHash;
        await existingUser.save();
        console.log(`[Seed] Synced user: ${userData.email} (${userData.role})`);
      } else {
        await User.create({
          name: userData.name,
          email: userData.email.toLowerCase(),
          passwordHash,
          role: userData.role
        });
        console.log(`[Seed] Created user: ${userData.email} (${userData.role})`);
      }
    }

    // 2. Seed Demo Customers
    const demoCustomers = [
      {
        name: 'Acme Technologies Pvt Ltd',
        email: 'billing@acme.io',
        phone: '+91 98765 43210',
        company: 'Acme Technologies',
        address: 'Tower A, Cyber City, Gurugram, India'
      },
      {
        name: 'Globex Logistics Corp',
        email: 'accounts@globex.org',
        phone: '+91 91234 56789',
        company: 'Globex Logistics',
        address: 'Bandra-Kurla Complex, Mumbai, India'
      },
      {
        name: 'Initech Software Solutions',
        email: 'finance@initech.dev',
        phone: '+91 99887 76655',
        company: 'Initech Software',
        address: 'Electronic City, Bengaluru, India'
      }
    ];

    const customerMap = {};
    for (const custData of demoCustomers) {
      let cust = await Customer.findOne({ email: custData.email.toLowerCase() });
      if (!cust) {
        cust = await Customer.create(custData);
        console.log(`[Seed] Created customer: ${cust.name}`);
      } else {
        console.log(`[Seed] Found customer: ${cust.name}`);
      }
      customerMap[custData.email.toLowerCase()] = cust;
    }

    // 3. Seed Demo Products
    const demoProducts = [
      {
        name: 'Cloud ERP Suite',
        type: 'software',
        salesPrice: 150000, // ₹1,500
        costPrice: 80000,
        notes: 'Full-featured enterprise resource planning suite',
        variants: [{ name: 'Priority Support Add-on', additionalPrice: 50000 }],
        isActive: true
      },
      {
        name: 'Smart Payroll Automation',
        type: 'service',
        salesPrice: 80000, // ₹800
        costPrice: 40000,
        notes: 'Automated payroll and compliance engine',
        variants: [],
        isActive: true
      }
    ];

    const productMap = {};
    for (const prodData of demoProducts) {
      let prod = await Product.findOne({ name: prodData.name });
      if (!prod) {
        prod = await Product.create(prodData);
        console.log(`[Seed] Created product: ${prod.name}`);
      } else {
        console.log(`[Seed] Found product: ${prod.name}`);
      }
      productMap[prodData.name] = prod;
    }

    // 4. Seed Demo Plans
    const erpProd = productMap['Cloud ERP Suite'];
    const payrollProd = productMap['Smart Payroll Automation'];

    const demoPlans = [
      {
        name: 'Cloud ERP Monthly Growth',
        productId: erpProd._id,
        billingInterval: 'monthly',
        price: 150000, // ₹1,500/month
        minimumQuantity: 1,
        isActive: true
      },
      {
        name: 'Cloud ERP Annual Enterprise',
        productId: erpProd._id,
        billingInterval: 'yearly',
        price: 1500000, // ₹15,000/year
        minimumQuantity: 1,
        isActive: true
      },
      {
        name: 'Payroll Starter Monthly',
        productId: payrollProd._id,
        billingInterval: 'monthly',
        price: 80000, // ₹800/month
        minimumQuantity: 1,
        isActive: true
      }
    ];

    const planMap = {};
    for (const planData of demoPlans) {
      let plan = await Plan.findOne({ name: planData.name, productId: planData.productId });
      if (!plan) {
        plan = await Plan.create(planData);
        console.log(`[Seed] Created plan: ${plan.name}`);
      } else {
        console.log(`[Seed] Found plan: ${plan.name}`);
      }
      planMap[planData.name] = plan;
    }

    // 5. Seed Demo Subscriptions
    const acmeCustomer = customerMap['billing@acme.io'];
    const globexCustomer = customerMap['accounts@globex.org'];
    const initechCustomer = customerMap['finance@initech.dev'];

    const erpMonthlyPlan = planMap['Cloud ERP Monthly Growth'];
    const payrollPlan = planMap['Payroll Starter Monthly'];

    // Sub A: Active, ready for immediate demo billing (nextBillingDate in past)
    let subA = await Subscription.findOne({ customerId: acmeCustomer._id, planId: erpMonthlyPlan._id });
    if (!subA) {
      subA = await Subscription.create({
        customerId: acmeCustomer._id,
        planId: erpMonthlyPlan._id,
        quantity: 2,
        unitPriceSnapshot: erpMonthlyPlan.price,
        billingIntervalSnapshot: erpMonthlyPlan.billingInterval,
        status: 'active',
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        nextBillingDate: new Date('2026-10-01T00:00:00.000Z') // due for billing demo
      });
      console.log(`[Seed] Created Sub A (Active & Due): ${subA._id}`);
    }

    // Sub B: Active with upcoming nextBillingDate (future)
    let subB = await Subscription.findOne({ customerId: globexCustomer._id, planId: payrollPlan._id });
    if (!subB) {
      subB = await Subscription.create({
        customerId: globexCustomer._id,
        planId: payrollPlan._id,
        quantity: 1,
        unitPriceSnapshot: payrollPlan.price,
        billingIntervalSnapshot: payrollPlan.billingInterval,
        status: 'active',
        startDate: new Date('2026-10-15T00:00:00.000Z'),
        nextBillingDate: new Date('2026-11-15T00:00:00.000Z')
      });
      console.log(`[Seed] Created Sub B (Active & Upcoming): ${subB._id}`);
    }

    // Sub C: Draft subscription for demonstrating the activation transition
    let subC = await Subscription.findOne({ customerId: initechCustomer._id, planId: erpMonthlyPlan._id });
    if (!subC) {
      subC = await Subscription.create({
        customerId: initechCustomer._id,
        planId: erpMonthlyPlan._id,
        quantity: 1,
        unitPriceSnapshot: erpMonthlyPlan.price,
        billingIntervalSnapshot: erpMonthlyPlan.billingInterval,
        status: 'draft',
        startDate: new Date('2026-11-01T00:00:00.000Z'),
        nextBillingDate: new Date('2026-12-01T00:00:00.000Z')
      });
      console.log(`[Seed] Created Sub C (Draft Lifecycle Demo): ${subC._id}`);
    }

    // 6. Ensure at least one Unpaid Invoice suitable for demonstrating payment recording
    const existingDemoInvoice = await Invoice.findOne({ invoiceNumber: 'INV-DEMO-UNPAID-001' });
    if (!existingDemoInvoice) {
      const subtotal = 160000; // ₹1,600 (quantity 2 x ₹800)
      const taxAmount = Math.round((subtotal * 18) / 100); // ₹288 = 28800 paise
      const totalAmount = subtotal + taxAmount; // 188800 paise (₹1,888)

      await Invoice.create({
        invoiceNumber: 'INV-DEMO-UNPAID-001',
        customerId: globexCustomer._id,
        subscriptionId: subB._id,
        billingPeriodStart: new Date('2026-09-15T00:00:00.000Z'),
        billingPeriodEnd: new Date('2026-10-15T00:00:00.000Z'),
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // due in 5 days
        lineItems: [
          {
            description: 'Smart Payroll Automation (monthly) x 2',
            quantity: 2,
            unitPrice: 80000,
            amount: subtotal
          }
        ],
        subtotal,
        taxRatePercent: 18,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        outstandingAmount: totalAmount,
        status: 'confirmed'
      });
      console.log('[Seed] Created demo unpaid invoice: INV-DEMO-UNPAID-001');
    }

    // 7. Ensure at least one Paid Invoice with corresponding Payment for Dashboard revenue
    const existingPaidInvoice = await Invoice.findOne({ invoiceNumber: 'INV-DEMO-PAID-001' });
    if (!existingPaidInvoice) {
      const subtotal = 150000; // ₹1,500
      const taxAmount = Math.round((subtotal * 18) / 100); // 27000 paise
      const totalAmount = subtotal + taxAmount; // 177000 paise (₹1,770)

      const paidInv = await Invoice.create({
        invoiceNumber: 'INV-DEMO-PAID-001',
        customerId: acmeCustomer._id,
        subscriptionId: subA._id,
        billingPeriodStart: new Date('2026-08-01T00:00:00.000Z'),
        billingPeriodEnd: new Date('2026-09-01T00:00:00.000Z'),
        dueAt: new Date('2026-09-08T00:00:00.000Z'),
        lineItems: [
          {
            description: 'Cloud ERP Suite (monthly) x 1',
            quantity: 1,
            unitPrice: 150000,
            amount: subtotal
          }
        ],
        subtotal,
        taxRatePercent: 18,
        taxAmount,
        totalAmount,
        paidAmount: totalAmount,
        outstandingAmount: 0,
        status: 'paid'
      });

      await Payment.create({
        invoiceId: paidInv._id,
        customerId: acmeCustomer._id,
        amount: totalAmount,
        paymentMethod: 'bank_transfer',
        transactionReference: 'TXN-DEMO-SEEDED-001',
        paidAt: new Date('2026-09-02T10:00:00.000Z')
      });
      console.log('[Seed] Created demo paid invoice & payment: INV-DEMO-PAID-001');
    }

    console.log('[Seed] Database seeding completed successfully.');
  } catch (error) {
    console.error(`[Seed] Error during seeding: ${error.message}`);
  } finally {
    await mongoose.connection.close();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  }
};

seedDatabase();
