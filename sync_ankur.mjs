import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => { const [k, ...v] = line.split('='); return [k.trim(), v.join('=').trim()]; })
);

const res = await fetch('https://vegimart-backend.vercel.app/api/vendors/6a966d564b12d71cbbe443af');
const json = await res.json();
const ankurDoc = json.data;

if (ankurDoc) {
  await mongoose.connect(envVars.MONGODB_URI);
  const db = mongoose.connection.db;
  const { _id, ...rest } = ankurDoc;
  await db.collection('vendors').updateOne(
    { email: 'ankur@gmail.com' },
    { $set: { ...rest, is_verified: '1' } },
    { upsert: true }
  );
  console.log('✅ Synchronized ankur@gmail.com into local database!');
}
process.exit(0);
