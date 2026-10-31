/**
 * Integration Tests: Dashboard Summary API
 * GET /api/dashboard/summary
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
const Payment = require('../../src/models/Payment');

const getAdminToken = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Pass@1234', salt);
  await User.create({ name: 'Admin', email: 'admin-dash@test.io', passwordHash, role: 'admin' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-dash@test.io', password: 'Pass@1234' });
  return res.body.data.token;
};

describe('Dashboard API', () => {
  let token;

  beforeEach(async () => {
    token = await getAdminToken();
  });

  // ── GET /api/dashboard/summary ────────────────────────────────────────────
  describe('GET /api/dashboard/summary', () => {
    test('TC-DASH-001: unauthenticated returns 401', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(401);
    });

    test('TC-DASH-002: empty database returns all zeros', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.activeSubscriptions).toBe(0);
      expect(res.body.data.totalCollectedRevenue).toBe(0);
      expect(res.body.data.totalOutstandingAmount).toBe(0);
      expect(res.body.data.overdueInvoices).toBe(0);
    });

    test('TC-DASH-003: active subscriptions count is correct', async () => {
      const customer = await Customer.create({ name: 'C1', email: 'c1@dash.io' });
      const product = await Product.create({ name: 'P1', salesPrice: 1000, isActive: true });
      const plan = await Plan.create({ name: 'Pl1', productId: product._id, billingInterval: 'monthly', price: 1000, isActive: true });
      // 2 active + 1 draft + 1 closed
      await Subscription.create({ customerId: customer._id, planId: plan._id, quantity: 1, unitPriceSnapshot: 1000, billingIntervalSnapshot: 'monthly', status: 'active', startDate: new Date(), nextBillingDate: new Date(Date.now() + 86400000) });
      await Subscription.create({ customerId: customer._id, planId: plan._id, quantity: 1, unitPriceSnapshot: 1000, billingIntervalSnapshot: 'monthly', status: 'active', startDate: new Date(), nextBillingDate: new Date(Date.now() + 86400000) });
      await Subscription.create({ customerId: customer._id, planId: plan._id, quantity: 1, unitPriceSnapshot: 1000, billingIntervalSnapshot: 'monthly', status: 'draft', startDate: new Date(), nextBillingDate: new Date(Date.now() + 86400000) });
      await Subscription.create({ customerId: customer._id, planId: plan._id, quantity: 1, unitPriceSnapshot: 1000, billingIntervalSnapshot: 'monthly', status: 'closed', startDate: new Date(), nextBillingDate: new Date(Date.now() + 86400000) });

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.activeSubscriptions).toBe(2);
    });

    test('TC-DASH-004: totalCollectedRevenue reflects payment records only', async () => {
      const customer = await Customer.create({ name: 'C2', email: 'c2@dash.io' });
      const product = await Product.create({ name: 'P2', salesPrice: 100000, isActive: true });
      const plan = await Plan.create({ name: 'Pl2', productId: product._id, billingInterval: 'monthly', price: 100000, isActive: true });
      const sub = await Subscription.create({
        customerId: customer._id, planId: plan._id, quantity: 1,
        unitPriceSnapshot: 100000, billingIntervalSnapshot: 'monthly', status: 'active',
        startDate: new Date('2026-09-01'), nextBillingDate: new Date('2026-11-01')
      });
      // Two payment records: 50000 + 118000
      await Payment.create({ invoiceId: sub._id, customerId: customer._id, amount: 50000, paymentMethod: 'demo' });
      await Payment.create({ invoiceId: sub._id, customerId: customer._id, amount: 118000, paymentMethod: 'demo' });

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.totalCollectedRevenue).toBe(168000); // 50000 + 118000
    });

    test('TC-DASH-005: totalOutstandingAmount excludes paid invoices', async () => {
      const customer = await Customer.create({ name: 'C3', email: 'c3@dash.io' });
      const product = await Product.create({ name: 'P3', salesPrice: 100000, isActive: true });
      const plan = await Plan.create({ name: 'Pl3', productId: product._id, billingInterval: 'monthly', price: 100000, isActive: true });
      const sub = await Subscription.create({
        customerId: customer._id, planId: plan._id, quantity: 1,
        unitPriceSnapshot: 100000, billingIntervalSnapshot: 'monthly', status: 'active',
        startDate: new Date('2026-09-01'), nextBillingDate: new Date('2026-11-01')
      });
      // Confirmed (unpaid) invoice: outstanding = 118000
      await Invoice.create({
        invoiceNumber: 'INV-DASH-001', customerId: customer._id, subscriptionId: sub._id,
        billingPeriodStart: new Date('2026-09-01'), billingPeriodEnd: new Date('2026-10-01'),
        dueAt: new Date(Date.now() + 7 * 86400000),
        subtotal: 100000, taxRatePercent: 18, taxAmount: 18000,
        totalAmount: 118000, paidAmount: 0, outstandingAmount: 118000, status: 'confirmed'
      });
      // Paid invoice: outstanding = 0 (should NOT be counted)
      await Invoice.create({
        invoiceNumber: 'INV-DASH-002', customerId: customer._id, subscriptionId: sub._id,
        billingPeriodStart: new Date('2026-08-01'), billingPeriodEnd: new Date('2026-09-01'),
        dueAt: new Date('2026-09-08'),
        subtotal: 100000, taxRatePercent: 18, taxAmount: 18000,
        totalAmount: 118000, paidAmount: 118000, outstandingAmount: 0, status: 'paid'
      });

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.totalOutstandingAmount).toBe(118000); // only unpaid invoice
    });

    test('TC-DASH-006: overdueInvoices counts only unpaid invoices past dueAt', async () => {
      const customer = await Customer.create({ name: 'C4', email: 'c4@dash.io' });
      const product = await Product.create({ name: 'P4', salesPrice: 100000, isActive: true });
      const plan = await Plan.create({ name: 'Pl4', productId: product._id, billingInterval: 'monthly', price: 100000, isActive: true });
      const sub = await Subscription.create({
        customerId: customer._id, planId: plan._id, quantity: 1,
        unitPriceSnapshot: 100000, billingIntervalSnapshot: 'monthly', status: 'active',
        startDate: new Date('2026-09-01'), nextBillingDate: new Date('2026-11-01')
      });
      // Overdue unpaid: dueAt in past
      await Invoice.create({
        invoiceNumber: 'INV-OVR-001', customerId: customer._id, subscriptionId: sub._id,
        billingPeriodStart: new Date('2026-08-01'), billingPeriodEnd: new Date('2026-09-01'),
        dueAt: new Date('2026-09-08'), // past
        subtotal: 100000, taxRatePercent: 18, taxAmount: 18000,
        totalAmount: 118000, paidAmount: 0, outstandingAmount: 118000, status: 'confirmed'
      });
      // Not overdue: dueAt in future
      await Invoice.create({
        invoiceNumber: 'INV-OVR-002', customerId: customer._id, subscriptionId: sub._id,
        billingPeriodStart: new Date('2026-09-01'), billingPeriodEnd: new Date('2026-10-01'),
        dueAt: new Date(Date.now() + 7 * 86400000),
        subtotal: 100000, taxRatePercent: 18, taxAmount: 18000,
        totalAmount: 118000, paidAmount: 0, outstandingAmount: 118000, status: 'confirmed'
      });
      // Paid + overdue date: should NOT count
      await Invoice.create({
        invoiceNumber: 'INV-OVR-003', customerId: customer._id, subscriptionId: sub._id,
        billingPeriodStart: new Date('2026-07-01'), billingPeriodEnd: new Date('2026-08-01'),
        dueAt: new Date('2026-08-08'), // past
        subtotal: 100000, taxRatePercent: 18, taxAmount: 18000,
        totalAmount: 118000, paidAmount: 118000, outstandingAmount: 0, status: 'paid'
      });

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.overdueInvoices).toBe(1); // only INV-OVR-001
    });

    test('TC-DASH-007: all monetary values are non-negative integers', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(Number.isInteger(res.body.data.totalCollectedRevenue)).toBe(true);
      expect(Number.isInteger(res.body.data.totalOutstandingAmount)).toBe(true);
      expect(res.body.data.totalCollectedRevenue).toBeGreaterThanOrEqual(0);
      expect(res.body.data.totalOutstandingAmount).toBeGreaterThanOrEqual(0);
    });

    test('TC-DASH-008: dashboard response has expected structure', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('activeSubscriptions');
      expect(res.body.data).toHaveProperty('totalCollectedRevenue');
      expect(res.body.data).toHaveProperty('totalOutstandingAmount');
      expect(res.body.data).toHaveProperty('overdueInvoices');
    });
  });
});
