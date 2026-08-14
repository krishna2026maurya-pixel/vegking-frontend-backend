import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => { const [k, ...v] = line.split('='); return [k.trim(), v.join('=').trim()]; })
);
const MONGODB_URI = envVars.MONGODB_URI;

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;
const vendor = await db.collection('vendors').findOne({ email: 'vendor11@vegking.com' });
console.log('Vendor:', vendor);
process.exit(0);
