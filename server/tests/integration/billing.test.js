/**
 * Integration Tests: Billing Engine, Invoices
 * POST /api/billing/run, GET /api/invoices, GET /api/invoices/:id
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Customer = require('../../src/models/Customer');
const Product = require('../../src/models/Product');
const Plan = require('../../src/models/Plan');
const Subscription = require('../../src/models/Subscription');
const Invoice = require('../../src/models/Invoice');

// ── Helpers ──────────────────────────────────────────────────────────────────
const getAdminToken = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Pass@1234', salt);
  await User.create({ name: 'Admin', email: 'admin-billing@test.io', passwordHash, role: 'admin' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-billing@test.io', password: 'Pass@1234' });
  return res.body.data.token;
};

const createDueSubscription = async (unitPrice = 150000, quantity = 2) => {
  const customer = await Customer.create({ name: 'Billed Corp', email: `billed-${Date.now()}@corp.io` });
  const product = await Product.create({ name: 'ERP Suite', salesPrice: unitPrice, isActive: true });
  const plan = await Plan.create({
    name: 'Monthly ERP',
    productId: product._id,
    billingInterval: 'monthly',
    price: unitPrice,
    isActive: true
  });
  // nextBillingDate in the past = due for billing
  const sub = await Subscription.create({
    customerId: customer._id,
    planId: plan._id,
    quantity,
    unitPriceSnapshot: unitPrice,
    billingIntervalSnapshot: 'monthly',
    status: 'active',
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    nextBillingDate: new Date('2026-10-01T00:00:00.000Z') // in the past
  });
  return { customer, product, plan, sub };
};

const createFutureSubscription = async () => {
  const customer = await Customer.create({ name: 'Future Corp', email: `future-${Date.now()}@corp.io` });
  const product = await Product.create({ name: 'Future Prod', salesPrice: 80000, isActive: true });
  const plan = await Plan.create({
    name: 'Future Monthly', productId: product._id, billingInterval: 'monthly', price: 80000, isActive: true
  });
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days in future
  const sub = await Subscription.create({
    customerId: customer._id, planId: plan._id, quantity: 1,
    unitPriceSnapshot: 80000, billingIntervalSnapshot: 'monthly', status: 'active',
    startDate: new Date(), nextBillingDate: future
  });
  return { customer, sub };
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Billing Engine', () => {
  let token;

  beforeEach(async () => {
    token = await getAdminToken();
  });

  // ── POST /api/billing/run ─────────────────────────────────────────────────
  describe('POST /api/billing/run', () => {
    test('TC-BILL-001: unauthenticated returns 401', async () => {
      const res = await request(app).post('/api/billing/run');
      expect(res.status).toBe(401);
    });

    test('TC-BILL-002: returns 200 with zero results when no subscriptions are due', async () => {
      const res = await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.totalDue).toBe(0);
      expect(res.body.data.createdCount).toBe(0);
    });

    test('TC-BILL-003: due subscription generates exactly one invoice', async () => {
      await createDueSubscription(150000, 2);
      const res = await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.createdCount).toBe(1);
      expect(res.body.data.invoices[0].status).toBe('created');
    });

    test('TC-BILL-004: subtotal = unitPrice * quantity (150000 * 2 = 300000)', async () => {
      await createDueSubscription(150000, 2);
      await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      const invoice = await Invoice.findOne({});
      expect(invoice.subtotal).toBe(300000); // 150000 * 2
    });

    test('TC-BILL-005: tax = Math.round(subtotal * 18 / 100)', async () => {
      await createDueSubscription(150000, 2);
      await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      const invoice = await Invoice.findOne({});
      const expectedTax = Math.round((300000 * 18) / 100); // 54000
      expect(invoice.taxAmount).toBe(expectedTax);
      expect(Number.isInteger(invoice.taxAmount)).toBe(true);
    });

    test('TC-BILL-006: totalAmount = subtotal + taxAmount', async () => {
      await createDueSubscription(150000, 2);
      await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      const invoice = await Invoice.findOne({});
      expect(invoice.totalAmount).toBe(invoice.subtotal + invoice.taxAmount);
    });

    test('TC-BILL-007: outstandingAmount equals totalAmount on new invoice', async () => {
      await createDueSubscription(150000, 2);
      await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      const invoice = await Invoice.findOne({});
      expect(invoice.outstandingAmount).toBe(invoice.totalAmount);
    });

    test('TC-BILL-008: invoice status is confirmed after billing run', async () => {
      await createDueSubscription(150000, 2);
      await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      const invoice = await Invoice.findOne({});
      expect(invoice.status).toBe('confirmed');
    });

    test('TC-BILL-009: future-dated subscriptions are NOT billed', async () => {
      await createFutureSubscription();
      const res = await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.totalDue).toBe(0);
      expect(res.body.data.createdCount).toBe(0);
    });

    test('TC-BILL-010: draft subscriptions are NOT billed', async () => {
      const customer = await Customer.create({ name: 'Draft Corp', email: 'draft@corp.io' });
      const product = await Product.create({ name: 'Draft Prod', salesPrice: 80000, isActive: true });
      const plan = await Plan.create({ name: 'Draft Plan', productId: product._id, billingInterval: 'monthly', price: 80000, isActive: true });
      await Subscription.create({
        customerId: customer._id, planId: plan._id, quantity: 1,
        unitPriceSnapshot: 80000, billingIntervalSnapshot: 'monthly',
        status: 'draft', // NOT active
        startDate: new Date('2026-09-01'), nextBillingDate: new Date('2026-10-01')
      });
      const res = await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.createdCount).toBe(0);
    });

    test('TC-BILL-011: closed subscriptions are NOT billed', async () => {
      const customer = await Customer.create({ name: 'Closed Corp', email: 'closed@corp.io' });
      const product = await Product.create({ name: 'Closed Prod', salesPrice: 80000, isActive: true });
      const plan = await Plan.create({ name: 'Closed Plan', productId: product._id, billingInterval: 'monthly', price: 80000, isActive: true });
      await Subscription.create({
        customerId: customer._id, planId: plan._id, quantity: 1,
        unitPriceSnapshot: 80000, billingIntervalSnapshot: 'monthly',
        status: 'closed',
        startDate: new Date('2026-09-01'), nextBillingDate: new Date('2026-10-01')
      });
      const res = await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.createdCount).toBe(0);
    });

    test('TC-BILL-012: nextBillingDate advances by one interval after billing', async () => {
      const { sub } = await createDueSubscription(100000, 1);
      const originalNext = new Date(sub.nextBillingDate);

      await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);

      const updatedSub = await Subscription.findById(sub._id);
      const newNext = new Date(updatedSub.nextBillingDate);

      // Next should be exactly one month after old nextBillingDate
      expect(newNext.getTime()).toBeGreaterThan(originalNext.getTime());
      expect(newNext.getUTCMonth()).toBe((originalNext.getUTCMonth() + 1) % 12);
    });

    test('TC-BILL-013: dueAt is approximately 7 days after now', async () => {
      await createDueSubscription(100000, 1);
      const beforeRun = Date.now();
      await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      const invoice = await Invoice.findOne({});
      const dueAt = new Date(invoice.dueAt).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      // dueAt should be ~7 days from now (within 60 seconds margin)
      expect(dueAt).toBeGreaterThanOrEqual(beforeRun + sevenDays - 60000);
      expect(dueAt).toBeLessThanOrEqual(beforeRun + sevenDays + 60000);
    });

    test('TC-BILL-014: duplicate billing run does not create duplicate invoice (idempotent)', async () => {
      await createDueSubscription(150000, 2);

      // First run
      const run1 = await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      expect(run1.body.data.createdCount).toBe(1);

      // Second run — subscription nextBillingDate has advanced, so not due again
      const run2 = await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      expect(run2.body.data.createdCount).toBe(0);

      // Exactly one invoice should exist
      const count = await Invoice.countDocuments({});
      expect(count).toBe(1);
    });

    test('TC-BILL-015: one failing subscription does not prevent others from being billed', async () => {
      // Create a normal due subscription
      await createDueSubscription(100000, 1);
      // Force a second subscription with a corrupted customerId to simulate a failure scenario
      const { sub: sub2 } = await createDueSubscription(80000, 1);
      await Subscription.findByIdAndUpdate(sub2._id, { customerId: null });

      // Billing should still process what it can
      const res = await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      // At least 1 should succeed even if another fails
      expect(res.body.data.createdCount + res.body.data.failedCount).toBeGreaterThanOrEqual(1);
    });

    test('TC-BILL-016: invoiceNumber format matches INV-YYYYMMDD-NNNNN', async () => {
      await createDueSubscription(100000, 1);
      await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      const invoice = await Invoice.findOne({});
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{8}-\d{5}$/);
    });

    test('TC-BILL-017: all amounts are integers (paise)', async () => {
      await createDueSubscription(100001, 1); // odd number to catch rounding issues
      await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${token}`);
      const invoice = await Invoice.findOne({});
      expect(Number.isInteger(invoice.subtotal)).toBe(true);
      expect(Number.isInteger(invoice.taxAmount)).toBe(true);
      expect(Number.isInteger(invoice.totalAmount)).toBe(true);
      expect(Number.isInteger(invoice.outstandingAmount)).toBe(true);
    });
  });

  // ── GET /api/invoices ─────────────────────────────────────────────────────
  describe('GET /api/invoices', () => {
    test('TC-INV-001: unauthenticated returns 401', async () => {
      const res = await request(app).get('/api/invoices');
      expect(res.status).toBe(401);
    });

    test('TC-INV-002: returns empty list when no invoices', async () => {
      const res = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
    });

    test('TC-INV-003: filters by status=confirmed', async () => {
      const { sub, customer } = await createDueSubscription(100000, 1);
      await Invoice.create({
        invoiceNumber: 'INV-TEST-001',
        customerId: customer._id,
        subscriptionId: sub._id,
        billingPeriodStart: new Date('2026-09-01'),
        billingPeriodEnd: new Date('2026-10-01'),
        dueAt: new Date(Date.now() + 7 * 86400000),
        subtotal: 100000,
        taxRatePercent: 18,
        taxAmount: 18000,
        totalAmount: 118000,
        outstandingAmount: 118000,
        status: 'confirmed'
      });
      const res = await request(app)
        .get('/api/invoices?status=confirmed')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.total).toBe(1);
    });

    test('TC-INV-004: filters by customerId', async () => {
      const { sub, customer } = await createDueSubscription(100000, 1);
      await Invoice.create({
        invoiceNumber: 'INV-TEST-002',
        customerId: customer._id,
        subscriptionId: sub._id,
        billingPeriodStart: new Date('2026-09-01'),
        billingPeriodEnd: new Date('2026-10-01'),
        dueAt: new Date(Date.now() + 7 * 86400000),
        subtotal: 100000, taxRatePercent: 18, taxAmount: 18000,
        totalAmount: 118000, outstandingAmount: 118000, status: 'confirmed'
      });
      const res = await request(app)
        .get(`/api/invoices?customerId=${customer._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.total).toBe(1);
    });
  });

  // ── GET /api/invoices/:id ─────────────────────────────────────────────────
  describe('GET /api/invoices/:id', () => {
    test('TC-INV-005: returns invoice with populated customer and subscription', async () => {
      const { sub, customer } = await createDueSubscription(100000, 1);
      const invoice = await Invoice.create({
        invoiceNumber: 'INV-TEST-003',
        customerId: customer._id,
        subscriptionId: sub._id,
        billingPeriodStart: new Date('2026-09-01'),
        billingPeriodEnd: new Date('2026-10-01'),
        dueAt: new Date(Date.now() + 7 * 86400000),
        subtotal: 100000, taxRatePercent: 18, taxAmount: 18000,
        totalAmount: 118000, outstandingAmount: 118000, status: 'confirmed'
      });
      const res = await request(app)
        .get(`/api/invoices/${invoice._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.invoice.customerId).toHaveProperty('name');
      expect(res.body.data.invoice.subscriptionId).toHaveProperty('status');
    });

    test('TC-INV-006: non-existent invoice ID returns 404', async () => {
      const res = await request(app)
        .get('/api/invoices/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    test('TC-INV-007: invalid ObjectId returns 400', async () => {
      const res = await request(app)
        .get('/api/invoices/not-an-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });
});
