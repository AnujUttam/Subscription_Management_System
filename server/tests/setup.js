const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

jest.setTimeout(60000);

beforeAll(async () => {
  const uriFile = path.resolve(__dirname, '.mongo-uri.tmp');
  let uri = 'mongodb://127.0.0.1:27017/test_db';
  if (fs.existsSync(uriFile)) {
    uri = fs.readFileSync(uriFile, 'utf8').trim();
  }
  console.log('[Setup] Connecting to MongoDB URI:', uri);

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-chars-long!!';
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        driverInfo: { name: 'nodejs', version: '6.0.0' }
      });
      console.log('[Setup] Mongoose connected successfully.');
    }
  } catch (err) {
    console.error('[Setup] Mongoose connection error:', err.message);
    throw err;
  }
}, 60000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('[Setup] Mongoose connection closed.');
  }
});
