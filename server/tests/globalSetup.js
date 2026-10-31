const { MongoMemoryReplSet } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup() {
  console.log('\n[GlobalSetup] Starting shared MongoMemoryReplSet with transaction support...');
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  console.log(`[GlobalSetup] MongoMemoryReplSet started at: ${uri}`);

  const uriFile = path.resolve(__dirname, '.mongo-uri.tmp');
  fs.writeFileSync(uriFile, uri, 'utf8');

  globalThis.__REPLSET_INSTANCE__ = replSet;
};
