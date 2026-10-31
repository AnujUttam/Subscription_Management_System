const mongoose = require('mongoose');
const dns = require('dns');

// Optional DNS override — set DNS_SERVERS=8.8.8.8,8.8.4.4 in .env
// to work around local DNS resolvers that cannot handle MongoDB Atlas SRV records.
// Remove DNS_SERVERS or leave it unset to use the system default resolver.
if (process.env.DNS_SERVERS) {
  const servers = process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean);
  if (servers.length > 0) {
    dns.setServers(servers);
    console.log(`[MongoDB] DNS override active — using servers: ${servers.join(', ')}`);
  }
}

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('[MongoDB] MONGODB_URI is not defined in environment variables. Database features will be unavailable.');
    return false;
  }

  try {
    const uri = new URL(mongoURI);
    const dbName = uri.pathname.length > 1 ? undefined : 'subscription_management';
    const conn = await mongoose.connect(mongoURI, dbName ? { dbName } : {});
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
