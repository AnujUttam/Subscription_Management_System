/**
 * Integration Tests: Customers API
 * GET /api/customers, POST /api/customers, GET /api/customers/:id
 * Requires auth (admin or staff).
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Customer = require('../../src/models/Customer');

// ── Test helpers ─────────────────────────────────────────────────────────────
const getAuthToken = async (role = 'admin') => {
  const email = `${role}-cust@test.io`;
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Pass@1234', salt);
  await User.create({ name: `Test ${role}`, email, passwordHash, role });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Pass@1234' });
  return res.body.data.token;
};

const validCustomer = (override = {}) => ({
  name: 'Acme Corp',
  email: 'billing@acmecorp.io',
  phone: '+91 9876543210',
  company: 'Acme Corp Ltd',
  address: 'Cyber City, Gurugram',
  ...override
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Customer API', () => {
  let adminToken;
  let staffToken;

  beforeEach(async () => {
    adminToken = await getAuthToken('admin');
    staffToken = await getAuthToken('staff');
  });

  // ── GET /api/customers ────────────────────────────────────────────────────
  describe('GET /api/customers', () => {
    test('TC-CUST-001: unauthenticated request returns 401', async () => {
      const res = await request(app).get('/api/customers');
      expect(res.status).toBe(401);
    });

    test('TC-CUST-002: admin can list customers (empty list)', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.customers)).toBe(true);
      expect(res.body.data.total).toBe(0);
    });

    test('TC-CUST-003: staff can list customers', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
    });

    test('TC-CUST-004: created customers appear in list', async () => {
      await Customer.create({ name: 'Test Co', email: 'test@co.io' });
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.customers[0].email).toBe('test@co.io');
    });
  });

  // ── POST /api/customers ───────────────────────────────────────────────────
  describe('POST /api/customers', () => {
    test('TC-CUST-005: creates customer with valid data (201)', async () => {
      const payload = validCustomer();
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.name).toBe('Acme Corp');
      expect(res.body.data.customer.email).toBe('billing@acmecorp.io');
    });

    test('TC-CUST-006: email is stored lowercased', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCustomer({ email: 'BILLING@ACMECORP.IO' }));
      expect(res.status).toBe(201);
      expect(res.body.data.customer.email).toBe('billing@acmecorp.io');
    });

    test('TC-CUST-007: missing name returns 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'nname@test.io' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-CUST-008: missing email returns 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'No Email Corp' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC-CUST-009: invalid email format returns 400', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bad Email', email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    test('TC-CUST-010: duplicate email returns 409 DUPLICATE_EMAIL', async () => {
      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCustomer());
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCustomer({ name: 'Acme Clone' }));
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    });

    test('TC-CUST-011: duplicate email case variation returns 409', async () => {
      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCustomer());
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCustomer({ email: 'BILLING@ACMECORP.IO', name: 'Dupe Uppercase' }));
      expect(res.status).toBe(409);
    });

    test('TC-CUST-012: unauthenticated POST returns 401', async () => {
      const res = await request(app)
        .post('/api/customers')
        .send(validCustomer());
      expect(res.status).toBe(401);
    });

    test('TC-CUST-013: password hash does not appear in customer response', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCustomer());
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    });
  });

  // ── GET /api/customers/:id ────────────────────────────────────────────────
  describe('GET /api/customers/:id', () => {
    test('TC-CUST-014: returns existing customer by ID (200)', async () => {
      const cust = await Customer.create({ name: 'Find Me', email: 'findme@test.io' });
      const res = await request(app)
        .get(`/api/customers/${cust._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.customer.name).toBe('Find Me');
    });

    test('TC-CUST-015: non-existent ObjectId returns 404', async () => {
      const res = await request(app)
        .get('/api/customers/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    test('TC-CUST-016: invalid ObjectId format returns 400 VALIDATION_ERROR (Regression test for BUG-001)', async () => {
      const res = await request(app)
        .get('/api/customers/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
