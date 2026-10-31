/**
 * Integration Tests: Authentication API
 * Requires: mongodb-memory-server (via global setup.js)
 * Tests: POST /api/auth/login, GET /api/auth/me
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/User');

// Helper: create a user directly in DB
const createUser = async (overrides = {}) => {
  const defaults = {
    name: 'Test Admin',
    email: 'admin@test.io',
    role: 'admin'
  };
  const data = { ...defaults, ...overrides };
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(overrides.password || 'Password@123', salt);
  return User.create({ ...data, passwordHash });
};

// Helper: get a valid token for a created user
const loginUser = async (email, password) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res;
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createUser({ email: 'admin@test.io', password: 'Password@123', role: 'admin' });
    await createUser({ email: 'staff@test.io', password: 'StaffPass@1', role: 'staff', name: 'Test Staff' });
  });

  test('TC-AUTH-001: valid admin credentials return 200 with token and user data', async () => {
    const res = await loginUser('admin@test.io', 'Password@123');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('admin@test.io');
    expect(res.body.data.user.role).toBe('admin');
  });

  test('TC-AUTH-002: valid staff credentials return 200', async () => {
    const res = await loginUser('staff@test.io', 'StaffPass@1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('staff');
  });

  test('TC-AUTH-003: password hash must never appear in login response', async () => {
    const res = await loginUser('admin@test.io', 'Password@123');
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/passwordHash/);
    expect(body).not.toMatch(/\$2[ab]\$/); // bcrypt hash pattern
  });

  test('TC-AUTH-004: wrong password returns 401 INVALID_CREDENTIALS', async () => {
    const res = await loginUser('admin@test.io', 'WrongPassword!');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('TC-AUTH-005: non-existent email returns 401 INVALID_CREDENTIALS', async () => {
    const res = await loginUser('nobody@test.io', 'Password@123');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('TC-AUTH-006: missing email returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Password@123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('TC-AUTH-007: missing password returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.io' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('TC-AUTH-008: email is case-normalized before lookup (ADMIN@TEST.IO)', async () => {
    const res = await loginUser('ADMIN@TEST.IO', 'Password@123');
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('admin@test.io');
  });

  test('TC-AUTH-009: email with leading/trailing spaces is normalized', async () => {
    const res = await loginUser('  admin@test.io  ', 'Password@123');
    expect(res.status).toBe(200);
  });

  test('TC-AUTH-010: empty body returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('TC-AUTH-011: returned JWT contains expected claims', async () => {
    const res = await loginUser('admin@test.io', 'Password@123');
    const token = res.body.data.token;
    const decoded = jwt.decode(token);
    expect(decoded).toHaveProperty('id');
    expect(decoded).toHaveProperty('role');
    expect(decoded.role).toBe('admin');
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const user = await createUser({ email: 'me@test.io', password: 'Password@123', role: 'admin' });
    userId = user._id.toString();
    const loginRes = await loginUser('me@test.io', 'Password@123');
    token = loginRes.body.data.token;
  });

  test('TC-AUTH-012: valid token returns user profile (200)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('me@test.io');
  });

  test('TC-AUTH-013: passwordHash must not appear in /me response', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/passwordHash/);
  });

  test('TC-AUTH-014: missing token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('TC-AUTH-015: malformed Bearer token returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.garbage');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  test('TC-AUTH-016: expired JWT returns 401', async () => {
    const expiredToken = jwt.sign(
      { id: userId, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  test('TC-AUTH-017: token for deleted user returns 401 USER_NOT_FOUND', async () => {
    // Create a token for a user ID that does not exist
    const fakeId = '507f1f77bcf86cd799439011';
    const fakeToken = jwt.sign(
      { id: fakeId, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  test('TC-AUTH-018: Authorization header without Bearer prefix returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', token); // no "Bearer " prefix
    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  test('TC-AUTH-019: register a new account successfully returns 201 with token and user profile', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Registered User',
        email: 'newuser@test.io',
        password: 'Password@123'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('newuser@test.io');
    expect(res.body.data.user.name).toBe('New Registered User');
    expect(res.body.data.user.role).toBe('staff');
  });

  test('TC-AUTH-020: password hash must never appear in register response', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hash Safe User',
        email: 'hashsafe@test.io',
        password: 'Password@123'
      });

    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/passwordHash/);
    expect(body).not.toMatch(/\$2[ab]\$/);
  });

  test('TC-AUTH-021: missing name returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'noname@test.io',
        password: 'Password@123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('TC-AUTH-022: missing email returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'No Email',
        password: 'Password@123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('TC-AUTH-023: missing password returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'No Password',
        email: 'nopass@test.io'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('TC-AUTH-024: register with existing email returns 409 DUPLICATE_EMAIL', async () => {
    await createUser({ email: 'duplicate@test.io', password: 'Password@123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Attempt',
        email: 'duplicate@test.io',
        password: 'Password@123'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });

  test('TC-AUTH-025: register email is case-normalized and trimmed', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Normalized User',
        email: '  NORM_USER@test.io  ',
        password: 'Password@123'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('norm_user@test.io');

    // Confirm duplicate check is also case-insensitive
    const dupRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: 'norm_user@test.io',
        password: 'Password@123'
      });
    expect(dupRes.status).toBe(409);
  });

  test('TC-AUTH-026: newly registered user can subsequently log in with their credentials', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Test User',
        email: 'login_tester@test.io',
        password: 'MySecurePassword@99'
      });
    expect(regRes.status).toBe(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login_tester@test.io',
        password: 'MySecurePassword@99'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.email).toBe('login_tester@test.io');
    expect(loginRes.body.data).toHaveProperty('token');
  });
});
