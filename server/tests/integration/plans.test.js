/**
 * Integration Tests: Plans API
 * GET /api/plans, POST /api/plans
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');

const getAdminToken = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Pass@1234', salt);
  await User.create({ name: 'Admin', email: 'admin-plan@test.io', passwordHash, role: 'admin' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-plan@test.io', password: 'Pass@1234' });
  return res.body.data.token;
};

const createActiveProduct = async () => {
  return Product.create({ name: 'Test Product', salesPrice: 100000, isActive: true });
};

const createInactiveProduct = async () => {
  return Product.create({ name: 'Inactive Product', salesPrice: 50000, isActive: false });
};

describe('Plans API', () => {
  let token;
  let activeProduct;
  let inactiveProduct;

  beforeEach(async () => {
    token = await getAdminToken();
    activeProduct = await createActiveProduct();
    inactiveProduct = await createInactiveProduct();
  });

  // ── GET /api/plans ────────────────────────────────────────────────────────
  describe('GET /api/plans', () => {
    test('TC-PLAN-001: unauthenticated returns 401', async () => {
      const res = await request(app).get('/api/plans');
      expect(res.status).toBe(401);
    });

    test('TC-PLAN-002: empty plan list returns 200', async () => {
      const res = await request(app)
        .get('/api/plans')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
    });

    test('TC-PLAN-003: plans include populated product reference', async () => {
      await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Monthly Basic',
          productId: activeProduct._id.toString(),
          billingInterval: 'monthly',
          price: 99900
        });
      const res = await request(app)
        .get('/api/plans')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.plans[0].productId).toHaveProperty('name');
      expect(res.body.data.plans[0].productId).toHaveProperty('salesPrice');
    });

    test('TC-PLAN-004: filters by isActive=true', async () => {
      // Create one active plan
      await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Active Plan', productId: activeProduct._id.toString(), billingInterval: 'monthly', price: 1000 });

      const res = await request(app)
        .get('/api/plans?isActive=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      res.body.data.plans.forEach(p => expect(p.isActive).toBe(true));
    });

    test('TC-PLAN-005: filters by productId', async () => {
      await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Prod Plan', productId: activeProduct._id.toString(), billingInterval: 'monthly', price: 1000 });

      const res = await request(app)
        .get(`/api/plans?productId=${activeProduct._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
    });
  });

  // ── POST /api/plans ───────────────────────────────────────────────────────
  describe('POST /api/plans', () => {
    test('TC-PLAN-006: creates plan with valid data (201)', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Monthly Growth',
          productId: activeProduct._id.toString(),
          billingInterval: 'monthly',
          price: 150000,
          minimumQuantity: 1
        });
      expect(res.status).toBe(201);
      expect(res.body.data.plan.name).toBe('Monthly Growth');
      expect(res.body.data.plan.price).toBe(150000);
    });

    test('TC-PLAN-007: missing name returns 400', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: activeProduct._id.toString(), billingInterval: 'monthly', price: 1000 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-PLAN-008: missing productId returns 400', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'No Product Plan', billingInterval: 'monthly', price: 1000 });
      expect(res.status).toBe(400);
    });

    test('TC-PLAN-009: missing price returns 400', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'No Price', productId: activeProduct._id.toString(), billingInterval: 'monthly' });
      expect(res.status).toBe(400);
    });

    test('TC-PLAN-010: invalid billingInterval returns 400', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Bad Interval', productId: activeProduct._id.toString(), billingInterval: 'quarterly', price: 1000 });
      expect(res.status).toBe(400);
    });

    test('TC-PLAN-011: all valid billingIntervals are accepted', async () => {
      const intervals = ['daily', 'weekly', 'monthly', 'yearly'];
      for (let i = 0; i < intervals.length; i++) {
        const res = await request(app)
          .post('/api/plans')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: `Plan ${intervals[i]}`, productId: activeProduct._id.toString(), billingInterval: intervals[i], price: 1000 });
        expect(res.status).toBe(201);
      }
    });

    test('TC-PLAN-012: negative price returns 400', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Neg Price', productId: activeProduct._id.toString(), billingInterval: 'monthly', price: -500 });
      expect(res.status).toBe(400);
    });

    test('TC-PLAN-013: fractional price returns 400', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Frac Price', productId: activeProduct._id.toString(), billingInterval: 'monthly', price: 999.99 });
      expect(res.status).toBe(400);
    });

    test('TC-PLAN-014: zero price is accepted (free tier)', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Free Plan', productId: activeProduct._id.toString(), billingInterval: 'monthly', price: 0 });
      expect(res.status).toBe(201);
      expect(res.body.data.plan.price).toBe(0);
    });

    test('TC-PLAN-015: non-existent productId returns 404', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Ghost Plan', productId: '507f1f77bcf86cd799439099', billingInterval: 'monthly', price: 1000 });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('TC-PLAN-016: inactive product reference returns 400', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Inactive Prod Plan', productId: inactiveProduct._id.toString(), billingInterval: 'monthly', price: 1000 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-PLAN-017: unauthenticated POST returns 401', async () => {
      const res = await request(app)
        .post('/api/plans')
        .send({ name: 'Unauth Plan', productId: activeProduct._id.toString(), billingInterval: 'monthly', price: 1000 });
      expect(res.status).toBe(401);
    });

    test('TC-PLAN-018: populated productId fields are returned after creation', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Populated Plan', productId: activeProduct._id.toString(), billingInterval: 'monthly', price: 99900 });
      expect(res.status).toBe(201);
      expect(res.body.data.plan.productId).toHaveProperty('name');
      expect(res.body.data.plan.productId).toHaveProperty('isActive');
    });
  });
});
