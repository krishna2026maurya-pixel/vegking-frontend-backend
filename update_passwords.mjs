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

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;

const hashedPassword = await bcrypt.hash('password123', 10);
await db.collection('vendors').updateMany({}, { $set: { password: hashedPassword } });

console.log('✅ Successfully updated all vendors with the password "password123"');
process.exit(0);
