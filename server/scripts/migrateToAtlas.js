require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/opptrack';
const ATLAS_URI = process.env.MONGO_URI;

async function migrate() {
  if (!ATLAS_URI || ATLAS_URI.includes('127.0.0.1')) {
    console.error('❌ MONGO_URI in .env is not set to MongoDB Atlas.');
    process.exit(1);
  }

  console.log('🔄 Starting migration from Local MongoDB to Atlas...');
  console.log(`Source (Local): ${LOCAL_URI}`);
  console.log(`Target (Atlas): ${ATLAS_URI.replace(/:([^@]+)@/, ':****@')}`);

  try {
    // 1. Connect to Local DB
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to Local MongoDB');

    // 2. Connect to Atlas DB
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to MongoDB Atlas');

    const collections = await localConn.db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections locally.`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const docs = await localConn.db.collection(colName).find({}).toArray();
      if (docs.length > 0) {
        console.log(` 🚚 Migrating ${docs.length} documents for "${colName}"...`);
        const atlasCol = atlasConn.db.collection(colName);
        for (const doc of docs) {
          await atlasCol.replaceOne({ _id: doc._id }, doc, { upsert: true });
        }
        console.log(` ✅ "${colName}" migrated successfully.`);
      } else {
        console.log(` ℹ️ "${colName}" is empty, skipping.`);
      }
    }

    console.log('\n🎉 Data Migration Complete! All local data is now in MongoDB Atlas.');
    await localConn.close();
    await atlasConn.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
