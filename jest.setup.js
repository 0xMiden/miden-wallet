const { Crypto, CryptoKey } = require('@peculiar/webcrypto');

let { db } = require('lib/miden/repo');

Object.assign(global, {
  crypto: new Crypto(),
  CryptoKey
});

global.afterEach(async () => {
  // clear fake indexeddb database
  await Promise.all(db.tables.map(t => t.clear()));
});
