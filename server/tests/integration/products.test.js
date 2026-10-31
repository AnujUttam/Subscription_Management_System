/**
 * Integration Tests: Products API
 * GET /api/products, POST /api/products, PATCH /api/products/:id
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');

const getAdminToken = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Pass@1234', salt);
  await User.create({ name: 'Admin', email: 'admin-prod@test.io', passwordHash, role: 'admin' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-prod@test.io', password: 'Pass@1234' });
  return res.body.data.token;
};

const validProduct = (override = {}) => ({
  name: 'Cloud ERP Suite',
  type: 'software',
  salesPrice: 150000, // ₹1500 in paise
  costPrice: 80000,
  notes: 'Enterprise ERP',
  ...override
});

describe('Products API', () => {
  let token;

  beforeEach(async () => {
    token = await getAdminToken();
  });

  // ── GET /api/products ─────────────────────────────────────────────────────
  describe('GET /api/products', () => {
    test('TC-PROD-001: unauthenticated returns 401', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(401);
    });

    test('TC-PROD-002: returns empty list when no products exist', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
    });

    test('TC-PROD-003: filters by isActive=true', async () => {
      await Product.create({ name: 'Active Prod', salesPrice: 10000, isActive: true });
      await Product.create({ name: 'Inactive Prod', salesPrice: 5000, isActive: false });
      const res = await request(app)
        .get('/api/products?isActive=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.products[0].isActive).toBe(true);
    });

    test('TC-PROD-004: filters by isActive=false', async () => {
      await Product.create({ name: 'Active Prod', salesPrice: 10000, isActive: true });
      await Product.create({ name: 'Inactive Prod', salesPrice: 5000, isActive: false });
      const res = await request(app)
        .get('/api/products?isActive=false')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.products[0].isActive).toBe(false);
    });

    test('TC-PROD-005: no isActive filter returns all products', async () => {
      await Product.create({ name: 'Prod1', salesPrice: 10000, isActive: true });
      await Product.create({ name: 'Prod2', salesPrice: 5000, isActive: false });
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`);
      expect(res.body.data.total).toBe(2);
    });
  });

  // ── POST /api/products ────────────────────────────────────────────────────
  describe('POST /api/products', () => {
    test('TC-PROD-006: creates product with valid integer paise price (201)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct());
      expect(res.status).toBe(201);
      expect(res.body.data.product.salesPrice).toBe(150000);
      expect(res.body.data.product.name).toBe('Cloud ERP Suite');
    });

    test('TC-PROD-007: missing name returns 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ salesPrice: 10000 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-PROD-008: missing salesPrice returns 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'No Price Product' });
      expect(res.status).toBe(400);
    });

    test('TC-PROD-009: negative salesPrice returns 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct({ salesPrice: -100 }));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-PROD-010: fractional (non-integer) salesPrice returns 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct({ salesPrice: 1500.50 }));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-PROD-011: zero salesPrice is accepted (free product)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct({ salesPrice: 0 }));
      expect(res.status).toBe(201);
      expect(res.body.data.product.salesPrice).toBe(0);
    });

    test('TC-PROD-012: negative costPrice returns 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct({ costPrice: -500 }));
      expect(res.status).toBe(400);
    });

    test('TC-PROD-013: fractional costPrice returns 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct({ costPrice: 99.99 }));
      expect(res.status).toBe(400);
    });

    test('TC-PROD-014: product with variants is created correctly', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct({
          variants: [{ name: 'Priority Support', additionalPrice: 50000 }]
        }));
      expect(res.status).toBe(201);
      expect(res.body.data.product.variants[0].name).toBe('Priority Support');
    });

    test('TC-PROD-015: variant with negative additionalPrice is rejected', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct({
          variants: [{ name: 'Bad Variant', additionalPrice: -100 }]
        }));
      expect(res.status).toBe(400);
    });

    test('TC-PROD-016: unauthenticated POST returns 401', async () => {
      const res = await request(app).post('/api/products').send(validProduct());
      expect(res.status).toBe(401);
    });
  });

  // ── PATCH /api/products/:id ───────────────────────────────────────────────
  describe('PATCH /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const prod = await Product.create({ name: 'ERP Prod', salesPrice: 100000, isActive: true });
      productId = prod._id.toString();
    });

    test('TC-PROD-017: updates product name and returns updated doc (200)', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'ERP Prod Updated' });
      expect(res.status).toBe(200);
      expect(res.body.data.product.name).toBe('ERP Prod Updated');
    });

    test('TC-PROD-018: can deactivate a product (isActive: false)', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: false });
      expect(res.status).toBe(200);
      expect(res.body.data.product.isActive).toBe(false);
    });

    test('TC-PROD-019: negative salesPrice update rejected (400)', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ salesPrice: -1 });
      expect(res.status).toBe(400);
    });

    test('TC-PROD-020: fractional salesPrice update rejected (400)', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ salesPrice: 999.99 });
      expect(res.status).toBe(400);
    });

    test('TC-PROD-021: non-existent product returns 404', async () => {
      const res = await request(app)
        .patch('/api/products/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Ghost Product' });
      expect(res.status).toBe(404);
    });

    test('TC-PROD-022: unauthenticated PATCH returns 401', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .send({ name: 'Hacker Update' });
      expect(res.status).toBe(401);
    });

    test('TC-PROD-023: mass-assignment protection — unknown fields are ignored', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Safe', __v: 999, createdAt: '1970-01-01' });
      expect(res.status).toBe(200);
      // createdAt should not have been overwritten
      expect(new Date(res.body.data.product.createdAt).getFullYear()).toBeGreaterThan(2020);
    });

    test('TC-PROD-024: fractional costPrice on PATCH rejected with 400 (Regression test for BUG-005)', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ costPrice: 499.50 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-PROD-025: invalid product ID format on PATCH returns 400', async () => {
      const res = await request(app)
        .patch('/api/products/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Invalid ID' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
