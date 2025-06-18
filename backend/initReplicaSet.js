// initReplicaSet.js
// One-time script to turn a standalone mongod (running with --replSet rs0) into a single-node replica set.
// Usage:
// 1. Ensure mongod is running:  mongod --dbpath ~/mongodb/data --replSet rs0 --port 27017
// 2. Run:                      node initReplicaSet.js
// The script is idempotent – if the replica set is already initiated it exits gracefully.

import { MongoClient } from 'mongodb';

(async () => {
  const uri = 'mongodb://localhost:27017';
  let client;
  
  try {
    // Connect to MongoDB with direct connection
    client = await MongoClient.connect(uri, {
      directConnection: true,
      serverSelectionTimeoutMS: 2000, // 2 second timeout
    });

    const admin = client.db('admin');
    
    try {
      // Check if replica set is already initialized
      const status = await admin.command({ replSetGetStatus: 1 });
      if (status.ok === 1) {
        console.log('✅ Replica set already initiated. State:', status.myState);
        process.exit(0);
      }
    } catch (err) {
      if (err.codeName === 'NotYetInitialized' || err.code === 94) {
        // This is expected - means we need to initialize
        console.log('ℹ️ Initializing new replica set...');
        const result = await admin.command({
          replSetInitiate: {
            _id: 'rs0',
            members: [{ _id: 0, host: 'localhost:27017' }]
          }
        });
        console.log('✅ Replica set initiated successfully!', result);
      } else {
        throw err; // Re-throw other errors
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MongoDB is running with: mongod --dbpath /path/to/data --replSet rs0');
    console.log('2. Check if port 27017 is available: lsof -i :27017');
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
})();
