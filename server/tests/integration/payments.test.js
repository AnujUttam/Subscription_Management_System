/**
 * Integration Tests: Payments API
 * POST /api/payments, GET /api/payments, GET /api/payments/:id
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const getAdminToken = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Pass@1234', salt);
  await User.create({ name: 'Admin', email: 'admin-pay@test.io', passwordHash, role: 'admin' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-pay@test.io', password: 'Pass@1234' });
  return res.body.data.token;
};

const createUnpaidInvoice = async (totalAmount = 177000) => {
  const customer = await Customer.create({ name: 'Pay Corp', email: `pay-${Date.now()}@corp.io` });
  const product = await Product.create({ name: 'Pay Prod', salesPrice: 150000, isActive: true });
  const plan = await Plan.create({ name: 'Pay Plan', productId: product._id, billingInterval: 'monthly', price: 150000, isActive: true });
  const sub = await Subscription.create({
    customerId: customer._id, planId: plan._id, quantity: 1,
    unitPriceSnapshot: 150000, billingIntervalSnapshot: 'monthly', status: 'active',
    startDate: new Date('2026-09-01'), nextBillingDate: new Date('2026-10-01')
  });
  const subtotal = 150000;
  const taxAmount = Math.round(subtotal * 18 / 100);
  const invTotal = subtotal + taxAmount;
  const invoice = await Invoice.create({
    invoiceNumber: `INV-TEST-PAY-${Date.now()}`,
    customerId: customer._id,
    subscriptionId: sub._id,
    billingPeriodStart: new Date('2026-09-01'),
    billingPeriodEnd: new Date('2026-10-01'),
    dueAt: new Date(Date.now() + 7 * 86400000),
    subtotal, taxRatePercent: 18, taxAmount,
    totalAmount: invTotal,
    paidAmount: 0,
    outstandingAmount: invTotal,
    status: 'confirmed'
  });
  return { customer, invoice };
};

const createPaidInvoice = async () => {
  const customer = await Customer.create({ name: 'Paid Corp', email: `paid-${Date.now()}@corp.io` });
  const product = await Product.create({ name: 'Paid Prod', salesPrice: 100000, isActive: true });
  const plan = await Plan.create({ name: 'Paid Plan', productId: product._id, billingInterval: 'monthly', price: 100000, isActive: true });
  const sub = await Subscription.create({
    customerId: customer._id, planId: plan._id, quantity: 1,
    unitPriceSnapshot: 100000, billingIntervalSnapshot: 'monthly', status: 'active',
    startDate: new Date('2026-09-01'), nextBillingDate: new Date('2026-10-01')
  });
  const invoice = await Invoice.create({
    invoiceNumber: `INV-PAID-${Date.now()}`,
    customerId: customer._id,
    subscriptionId: sub._id,
    billingPeriodStart: new Date('2026-09-01'),
    billingPeriodEnd: new Date('2026-10-01'),
    dueAt: new Date(Date.now() + 7 * 86400000),
    subtotal: 100000, taxRatePercent: 18, taxAmount: 18000,
    totalAmount: 118000,
    paidAmount: 118000,
    outstandingAmount: 0,
    status: 'paid'
  });
  return { customer, invoice };
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Payments API', () => {
  let token;

  beforeEach(async () => {
    token = await getAdminToken();
  });

  // ── POST /api/payments ────────────────────────────────────────────────────
  describe('POST /api/payments', () => {
    test('TC-PAY-001: records full payment for unpaid invoice (201)', async () => {
      const { invoice } = await createUnpaidInvoice();
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString(), paymentMethod: 'bank_transfer' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('TC-PAY-002: payment amount is derived from invoice outstanding (not client-supplied)', async () => {
      const { invoice } = await createUnpaidInvoice();
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString(), amount: 1 }); // client tries to supply amount=1
      expect(res.status).toBe(201);
      // The payment amount should equal the invoice outstanding, not 1
      expect(res.body.data.payment.amount).toBe(invoice.outstandingAmount);
    });

    test('TC-PAY-003: invoice status becomes paid after payment', async () => {
      const { invoice } = await createUnpaidInvoice();
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString() });
      expect(res.body.data.invoice.status).toBe('paid');
      expect(res.body.data.invoice.outstandingAmount).toBe(0);
    });

    test('TC-PAY-004: invoice outstandingAmount is zero after payment', async () => {
      const { invoice } = await createUnpaidInvoice();
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString() });
      const updatedInvoice = await Invoice.findById(invoice._id);
      expect(updatedInvoice.outstandingAmount).toBe(0);
      expect(updatedInvoice.paidAmount).toBe(updatedInvoice.totalAmount);
    });

    test('TC-PAY-005: second payment on already-paid invoice returns 400 INVOICE_ALREADY_PAID', async () => {
      const { invoice } = await createUnpaidInvoice();
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString() });
      // Second attempt
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString() });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVOICE_ALREADY_PAID');
    });

    test('TC-PAY-006: payment against already-paid invoice does not create duplicate payment record', async () => {
      const { invoice } = await createUnpaidInvoice();
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString() });
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString() });
      const count = await Payment.countDocuments({ invoiceId: invoice._id });
      expect(count).toBe(1);
    });

    test('TC-PAY-007: missing invoiceId returns 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ paymentMethod: 'cash' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-PAY-008: invalid invoiceId format returns 400', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: 'not-an-id' });
      expect(res.status).toBe(400);
    });

    test('TC-PAY-009: non-existent invoiceId returns 404', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: '507f1f77bcf86cd799439099' });
      expect(res.status).toBe(404);
    });

    test('TC-PAY-010: unsupported paymentMethod returns 400 VALIDATION_ERROR (Regression test for BUG-003)', async () => {
      const { invoice } = await createUnpaidInvoice();
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString(), paymentMethod: 'crypto' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-PAY-011: valid paymentMethods are accepted', async () => {
      const methods = ['cash', 'bank_transfer', 'credit_card', 'demo'];
      for (const method of methods) {
        const { invoice } = await createUnpaidInvoice();
        const res = await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${token}`)
          .send({ invoiceId: invoice._id.toString(), paymentMethod: method });
        expect(res.status).toBe(201);
        expect(res.body.data.payment.paymentMethod).toBe(method);
      }
    });

    test('TC-PAY-012: payment on zero-balance invoice is rejected', async () => {
      const { invoice } = await createPaidInvoice();
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString() });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVOICE_ALREADY_PAID');
    });

    test('TC-PAY-013: unauthenticated returns 401', async () => {
      const { invoice } = await createUnpaidInvoice();
      const res = await request(app)
        .post('/api/payments')
        .send({ invoiceId: invoice._id.toString() });
      expect(res.status).toBe(401);
    });

    test('TC-PAY-014: payment record has correct amount (full outstanding)', async () => {
      const { invoice } = await createUnpaidInvoice();
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString() });
      const payment = await Payment.findOne({ invoiceId: invoice._id });
      expect(payment.amount).toBe(invoice.outstandingAmount);
      expect(Number.isInteger(payment.amount)).toBe(true);
    });

    test('TC-PAY-015: populated payment response includes invoice details', async () => {
      const { invoice } = await createUnpaidInvoice();
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceId: invoice._id.toString() });
      expect(res.body.data.payment).toHaveProperty('invoiceId');
      expect(res.body.data.payment.invoiceId).toHaveProperty('invoiceNumber');
    });
  });

  // ── GET /api/payments ─────────────────────────────────────────────────────
  describe('GET /api/payments', () => {
    test('TC-PAY-016: unauthenticated returns 401', async () => {
      const res = await request(app).get('/api/payments');
      expect(res.status).toBe(401);
    });

    test('TC-PAY-017: returns empty list', async () => {
      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
    });

    test('TC-PAY-018: filters by invoiceId', async () => {
      const { invoice, customer } = await createUnpaidInvoice();
      await Payment.create({ invoiceId: invoice._id, customerId: customer._id, amount: invoice.outstandingAmount, paymentMethod: 'demo' });
      const res = await request(app)
        .get(`/api/payments?invoiceId=${invoice._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.total).toBe(1);
    });

    test('TC-PAY-019: filters by customerId', async () => {
      const { invoice, customer } = await createUnpaidInvoice();
      await Payment.create({ invoiceId: invoice._id, customerId: customer._id, amount: 50000, paymentMethod: 'demo' });
      const res = await request(app)
        .get(`/api/payments?customerId=${customer._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.total).toBe(1);
    });
  });

  // ── GET /api/payments/:id ─────────────────────────────────────────────────
  describe('GET /api/payments/:id', () => {
    test('TC-PAY-020: returns payment by ID with populated fields', async () => {
      const { invoice, customer } = await createUnpaidInvoice();
      const payment = await Payment.create({ invoiceId: invoice._id, customerId: customer._id, amount: 100000, paymentMethod: 'demo' });
      const res = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.payment.invoiceId).toHaveProperty('invoiceNumber');
      expect(res.body.data.payment.customerId).toHaveProperty('name');
    });

    test('TC-PAY-021: non-existent ID returns 404', async () => {
      const res = await request(app)
        .get('/api/payments/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    test('TC-PAY-022: invalid ID format returns 400', async () => {
      const res = await request(app)
        .get('/api/payments/not-an-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });
});
