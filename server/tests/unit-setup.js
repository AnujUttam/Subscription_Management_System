/**
 * Unit-only setup — no MongoDB needed.
 * Only sets environment variables for pure unit tests.
 */
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-chars-long!!';
process.env.NODE_ENV = 'test';
