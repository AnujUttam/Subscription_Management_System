/**
 * Integration Tests: Subscriptions API
 * POST /api/subscriptions, GET /api/subscriptions, GET /api/subscriptions/:id,
 * PATCH /api/subscriptions/:id
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Customer = require('../../src/models/Customer');
const Product = require('../../src/models/Product');
const Plan = require('../../src/models/Plan');
const Subscription = require('../../src/models/Subscription');

// ── Helpers ──────────────────────────────────────────────────────────────────
const getAdminToken = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Pass@1234', salt);
  await User.create({ name: 'Admin', email: 'admin-sub@test.io', passwordHash, role: 'admin' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-sub@test.io', password: 'Pass@1234' });
  return res.body.data.token;
};

const createTestFixtures = async () => {
  const customer = await Customer.create({ name: 'Test Customer', email: 'customer@test.io' });
  const product = await Product.create({ name: 'Test Product', salesPrice: 100000, isActive: true });
  const plan = await Plan.create({
    name: 'Monthly Basic',
    productId: product._id,
    billingInterval: 'monthly',
    price: 99900,
    minimumQuantity: 1,
    isActive: true
  });
  const inactivePlan = await Plan.create({
    name: 'Inactive Plan',
    productId: product._id,
    billingInterval: 'monthly',
    price: 50000,
    isActive: false
  });
  return { customer, product, plan, inactivePlan };
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Subscriptions API', () => {
  let token;
  let fixtures;

  beforeEach(async () => {
    token = await getAdminToken();
    fixtures = await createTestFixtures();
  });

  // ── POST /api/subscriptions ───────────────────────────────────────────────
  describe('POST /api/subscriptions', () => {
    test('TC-SUB-001: creates subscription in draft status (201)', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerId: fixtures.customer._id.toString(),
          planId: fixtures.plan._id.toString(),
          quantity: 1
        });
      expect(res.status).toBe(201);
      expect(res.body.data.subscription.status).toBe('draft');
    });

    test('TC-SUB-002: price snapshot is captured from plan price at creation time', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerId: fixtures.customer._id.toString(),
          planId: fixtures.plan._id.toString(),
          quantity: 1
        });
      expect(res.body.data.subscription.unitPriceSnapshot).toBe(fixtures.plan.price);
    });

    test('TC-SUB-003: billingInterval snapshot captured from plan', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerId: fixtures.customer._id.toString(),
          planId: fixtures.plan._id.toString(),
          quantity: 2
        });
      expect(res.body.data.subscription.billingIntervalSnapshot).toBe('monthly');
    });

    test('TC-SUB-004: nextBillingDate is startDate + 1 month (monthly plan)', async () => {
      const startDate = '2026-01-15T00:00:00.000Z';
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerId: fixtures.customer._id.toString(),
          planId: fixtures.plan._id.toString(),
          quantity: 1,
          startDate
        });
      expect(res.status).toBe(201);
      const nextBilling = new Date(res.body.data.subscription.nextBillingDate);
      expect(nextBilling.toISOString()).toBe('2026-02-15T00:00:00.000Z');
    });

    test('TC-SUB-005: missing customerId returns 400', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ planId: fixtures.plan._id.toString(), quantity: 1 });
      expect(res.status).toBe(400);
    });

    test('TC-SUB-006: invalid customerId format returns 400', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerId: 'not-an-id', planId: fixtures.plan._id.toString(), quantity: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-SUB-007: non-existent customerId returns 404', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerId: '507f1f77bcf86cd799439099', planId: fixtures.plan._id.toString(), quantity: 1 });
      expect(res.status).toBe(404);
    });

    test('TC-SUB-008: non-existent planId returns 404', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerId: fixtures.customer._id.toString(), planId: '507f1f77bcf86cd799439099', quantity: 1 });
      expect(res.status).toBe(404);
    });

    test('TC-SUB-009: inactive plan returns 400', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerId: fixtures.customer._id.toString(), planId: fixtures.inactivePlan._id.toString(), quantity: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-SUB-010: fractional quantity returns 400', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerId: fixtures.customer._id.toString(), planId: fixtures.plan._id.toString(), quantity: 1.5 });
      expect(res.status).toBe(400);
    });

    test('TC-SUB-011: zero quantity returns 400', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerId: fixtures.customer._id.toString(), planId: fixtures.plan._id.toString(), quantity: 0 });
      expect(res.status).toBe(400);
    });

    test('TC-SUB-012: quantity below plan minimumQuantity returns 400', async () => {
      // Set plan minimumQuantity to 2
      await Plan.findByIdAndUpdate(fixtures.plan._id, { minimumQuantity: 2 });
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerId: fixtures.customer._id.toString(), planId: fixtures.plan._id.toString(), quantity: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/minimum/i);
    });

    test('TC-SUB-013: invalid startDate returns 400', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerId: fixtures.customer._id.toString(), planId: fixtures.plan._id.toString(), quantity: 1, startDate: 'not-a-date' });
      expect(res.status).toBe(400);
    });

    test('TC-SUB-014: unauthenticated returns 401', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .send({ customerId: fixtures.customer._id.toString(), planId: fixtures.plan._id.toString(), quantity: 1 });
      expect(res.status).toBe(401);
    });

    test('TC-SUB-015: snapshot does NOT update when plan price changes after creation', async () => {
      const createRes = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerId: fixtures.customer._id.toString(), planId: fixtures.plan._id.toString(), quantity: 1 });
      const originalSnapshot = createRes.body.data.subscription.unitPriceSnapshot;

      // Change plan price
      await Plan.findByIdAndUpdate(fixtures.plan._id, { price: 200000 });

      // Retrieve subscription — snapshot must still match original
      const getRes = await request(app)
        .get(`/api/subscriptions/${createRes.body.data.subscription._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.body.data.subscription.unitPriceSnapshot).toBe(originalSnapshot);
    });
  });

  // ── GET /api/subscriptions ────────────────────────────────────────────────
  describe('GET /api/subscriptions', () => {
    test('TC-SUB-016: lists subscriptions (200)', async () => {
      const res = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.subscriptions)).toBe(true);
    });

    test('TC-SUB-017: filters by status=draft', async () => {
      await Subscription.create({
        customerId: fixtures.customer._id, planId: fixtures.plan._id, quantity: 1,
        unitPriceSnapshot: 99900, billingIntervalSnapshot: 'monthly', status: 'draft',
        startDate: new Date(), nextBillingDate: new Date(Date.now() + 86400000)
      });
      await Subscription.create({
        customerId: fixtures.customer._id, planId: fixtures.plan._id, quantity: 1,
        unitPriceSnapshot: 99900, billingIntervalSnapshot: 'monthly', status: 'active',
        startDate: new Date(), nextBillingDate: new Date(Date.now() + 86400000)
      });
      const res = await request(app)
        .get('/api/subscriptions?status=draft')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.subscriptions[0].status).toBe('draft');
    });

    test('TC-SUB-018: filters by customerId', async () => {
      const other = await Customer.create({ name: 'Other', email: 'other@test.io' });
      await Subscription.create({
        customerId: fixtures.customer._id, planId: fixtures.plan._id, quantity: 1,
        unitPriceSnapshot: 99900, billingIntervalSnapshot: 'monthly', status: 'draft',
        startDate: new Date(), nextBillingDate: new Date(Date.now() + 86400000)
      });
      await Subscription.create({
        customerId: other._id, planId: fixtures.plan._id, quantity: 1,
        unitPriceSnapshot: 99900, billingIntervalSnapshot: 'monthly', status: 'draft',
        startDate: new Date(), nextBillingDate: new Date(Date.now() + 86400000)
      });
      const res = await request(app)
        .get(`/api/subscriptions?customerId=${fixtures.customer._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.total).toBe(1);
    });
  });

  // ── GET /api/subscriptions/:id ────────────────────────────────────────────
  describe('GET /api/subscriptions/:id', () => {
    test('TC-SUB-019: returns subscription by ID', async () => {
      const sub = await Subscription.create({
        customerId: fixtures.customer._id, planId: fixtures.plan._id, quantity: 1,
        unitPriceSnapshot: 99900, billingIntervalSnapshot: 'monthly', status: 'draft',
        startDate: new Date(), nextBillingDate: new Date(Date.now() + 86400000)
      });
      const res = await request(app)
        .get(`/api/subscriptions/${sub._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.subscription._id).toBe(sub._id.toString());
    });

    test('TC-SUB-020: non-existent ID returns 404', async () => {
      const res = await request(app)
        .get('/api/subscriptions/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    test('TC-SUB-021: invalid ID format returns 400', async () => {
      const res = await request(app)
        .get('/api/subscriptions/bad-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH /api/subscriptions/:id (status transitions) ────────────────────
  describe('PATCH /api/subscriptions/:id — status transitions', () => {
    let draftSub;

    beforeEach(async () => {
      draftSub = await Subscription.create({
        customerId: fixtures.customer._id, planId: fixtures.plan._id, quantity: 1,
        unitPriceSnapshot: 99900, billingIntervalSnapshot: 'monthly', status: 'draft',
        startDate: new Date(), nextBillingDate: new Date(Date.now() + 86400000)
      });
    });

    test('TC-SUB-022: draft -> active transition (200)', async () => {
      const res = await request(app)
        .patch(`/api/subscriptions/${draftSub._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'active' });
      expect(res.status).toBe(200);
      expect(res.body.data.subscription.status).toBe('active');
    });

    test('TC-SUB-023: active -> closed transition (200)', async () => {
      await Subscription.findByIdAndUpdate(draftSub._id, { status: 'active' });
      const res = await request(app)
        .patch(`/api/subscriptions/${draftSub._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'closed' });
      expect(res.status).toBe(200);
      expect(res.body.data.subscription.status).toBe('closed');
    });

    test('TC-SUB-024: draft -> closed transition is rejected (400)', async () => {
      const res = await request(app)
        .patch(`/api/subscriptions/${draftSub._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'closed' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    test('TC-SUB-025: closed -> active transition is rejected (400)', async () => {
      await Subscription.findByIdAndUpdate(draftSub._id, { status: 'closed' });
      const res = await request(app)
        .patch(`/api/subscriptions/${draftSub._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'active' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    test('TC-SUB-026: active -> active (repeated update) is rejected (400)', async () => {
      await Subscription.findByIdAndUpdate(draftSub._id, { status: 'active' });
      const res = await request(app)
        .patch(`/api/subscriptions/${draftSub._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'active' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    test('TC-SUB-027: non-existent subscription ID returns 404', async () => {
      const res = await request(app)
        .patch('/api/subscriptions/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'active' });
      expect(res.status).toBe(404);
    });

    test('TC-SUB-028: invalid ID format returns 400', async () => {
      const res = await request(app)
        .patch('/api/subscriptions/bad-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'active' });
      expect(res.status).toBe(400);
    });

    test('TC-SUB-029: unauthenticated PATCH returns 401', async () => {
      const res = await request(app)
        .patch(`/api/subscriptions/${draftSub._id}`)
        .send({ status: 'active' });
      expect(res.status).toBe(401);
    });
  });
});
