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

// 1. Update vegking database (Local)
await mongoose.connect(MONGODB_URI);
const dbVegking = mongoose.connection.db;
const r1 = await dbVegking.collection('vendors').updateMany({}, {
  $set: { password: hashedPassword, is_verified: '1' }
});
console.log(`✅ Updated ${r1.modifiedCount} vendors in 'vegking' DB (Local)`);
await mongoose.disconnect();

// 2. Update vegimart database (Vercel)
const vegimartUri = MONGODB_URI.replace('/vegking?', '/vegimart?');
await mongoose.connect(vegimartUri);
const dbVegimart = mongoose.connection.db;
const r2 = await dbVegimart.collection('vendors').updateMany({}, {
  $set: { password: hashedPassword, is_verified: '1' }
});
console.log(`✅ Updated ${r2.modifiedCount} vendors in 'vegimart' DB (Vercel)`);
await mongoose.disconnect();

console.log('\n🎉 ALL VENDORS ACROSS BOTH DATABASES NOW USE "password123" AND ARE VERIFIED!');
process.exit(0);
