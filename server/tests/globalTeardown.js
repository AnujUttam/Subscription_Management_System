const fs = require('fs');
const path = require('path');

module.exports = async function globalTeardown() {
  console.log('\n[GlobalTeardown] Stopping shared MongoMemoryReplSet instance...');
  const replSet = globalThis.__REPLSET_INSTANCE__;
  if (replSet) {
    await replSet.stop();
  }
  const uriFile = path.resolve(__dirname, '.mongo-uri.tmp');
  if (fs.existsSync(uriFile)) {
    fs.unlinkSync(uriFile);
  }
  console.log('[GlobalTeardown] Cleanup complete.');
};
