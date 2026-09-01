import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import bcrypt from 'bcryptjs';

const envContent = readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => { const [k, ...v] = line.split('='); return [k.trim(), v.join('=').trim()]; })
);

const MONGODB_URI = envVars.MONGODB_URI;
const hashedPassword = await bcrypt.hash('password123', 10);

// 1. Fetch all vegking vendors
await mongoose.connect(MONGODB_URI);
const dbVegking = mongoose.connection.db;
const vegkingVendors = await dbVegking.collection('vendors').find({}).toArray();
await mongoose.disconnect();

// 2. Insert/update in vegimart DB
const vegimartUri = MONGODB_URI.replace('/vegking?', '/vegimart?');
await mongoose.connect(vegimartUri);
const dbVegimart = mongoose.connection.db;

let addedCount = 0;
for (const v of vegkingVendors) {
  const existing = await dbVegimart.collection('vendors').findOne({ email: v.email });
  if (!existing) {
    const newVendor = { ...v, password: hashedPassword, is_verified: '1' };
    await dbVegimart.collection('vendors').insertOne(newVendor);
    addedCount++;
  } else {
    await dbVegimart.collection('vendors').updateOne(
      { _id: existing._id },
      { $set: { password: hashedPassword, is_verified: '1' } }
    );
  }
}

// Also ensure all @vegimart.com vendors are updated
await dbVegimart.collection('vendors').updateMany(
  {},
  { $set: { password: hashedPassword, is_verified: '1' } }
);

console.log(`✅ Added ${addedCount} vendors to vegimart DB. Total vendors synced.`);
process.exit(0);
