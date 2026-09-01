import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import bcrypt from 'bcryptjs';

const envContent = readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => { const [k, ...v] = line.split('='); return [k.trim(), v.join('=').trim()]; })
);

const hashedPassword = await bcrypt.hash('password123', 10);

await mongoose.connect(envVars.MONGODB_URI);
const db = mongoose.connection.db;
await db.collection('vendors').updateOne(
  { email: 'ankur@gmail.com' },
  { $set: { password: hashedPassword, is_verified: '1' } }
);

console.log('✅ ankur@gmail.com password is now set to "password123" and is verified!');
process.exit(0);
