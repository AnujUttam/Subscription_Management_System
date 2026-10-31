/**
 * Integration Tests: Health, 404, Global Error Handler, Unknown Routes
 * No auth required for /api/health.
 */

const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/health', () => {
  test('TC-HEALTH-001: returns 200 with status healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  test('TC-HEALTH-002: response includes database connected state', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data.database).toHaveProperty('connected');
    expect(typeof res.body.data.database.connected).toBe('boolean');
  });

  test('TC-HEALTH-003: response includes uptime (number)', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.data.uptime).toBe('number');
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
  });

  test('TC-HEALTH-004: response includes ISO timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('TC-HEALTH-005: database is connected (in-memory server is running)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.data.database.connected).toBe(true);
    expect(res.body.data.database.status).toBe('connected');
  });
});

describe('404 and unknown routes', () => {
  test('TC-404-001: GET on unknown route returns 404 NOT_FOUND', async () => {
    const res = await request(app).get('/api/nonexistent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('TC-404-002: POST on unknown route returns 404', async () => {
    const res = await request(app).post('/api/does-not-exist').send({ foo: 'bar' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('TC-404-003: root path returns 200 with API running message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Malformed JSON handling', () => {
  test('TC-JSON-001: malformed JSON body returns 400 INVALID_JSON (Regression test for BUG-004)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json}}');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  test('TC-JSON-002: no body on POST that requires body returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('');
    // Missing body — controller returns 400 VALIDATION_ERROR
    expect(res.status).toBe(400);
  });
});

describe('CORS and Origin Configuration', () => {
  test('TC-CORS-001: allows requests and returns Access-Control-Allow-Origin for http://localhost:3000', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  test('TC-CORS-002: allows requests for http://localhost:5173', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  test('TC-CORS-003: rejects requests from untrusted origins with 403 CORS_ERROR', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://malicious-site.com');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CORS_ERROR');
  });
});
