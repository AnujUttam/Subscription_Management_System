const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env if present (root or server folder)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to local server/.env

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Server] Subscription Management System API running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });

  // Handle unhandled promise rejections — log and exit so Render can auto-restart cleanly
  process.on('unhandledRejection', (err) => {
    console.error(`[UnhandledRejection] ${err.message}`);
    server.close(() => process.exit(1));
  });

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
