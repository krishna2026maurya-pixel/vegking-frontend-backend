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

const ankurData = {
  full_name: 'ankur',
  email: 'ankur@gmail.com',
  mobile_number: '1234567891',
  password: hashedPassword,
  shop_name: 'ankur farm',
  gst_number: '',
  pan_number: 'asdfgh5',
  licence_number: '12345678901234',
  address: 'asdfghj',
  state: '',
  city: 'lucknow',
  pincode: '',
  landmark: '',
  shop_image: '',
  gps_location: 'lucknow',
  is_verified: '1',
  is_bestseller: '0',
  wallet_balance: 0,
};

// 1. Update in vegimart
await mongoose.connect(envVars.MONGODB_URI);
await mongoose.connection.db.collection('vendors').updateOne(
  { email: 'ankur@gmail.com' },
  { $set: ankurData },
  { upsert: true }
);
await mongoose.disconnect();

// 2. Update in vegking
const vegkingUri = envVars.MONGODB_URI.replace('/vegimart?', '/vegking?');
await mongoose.connect(vegkingUri);
await mongoose.connection.db.collection('vendors').updateOne(
  { email: 'ankur@gmail.com' },
  { $set: ankurData },
  { upsert: true }
);
await mongoose.disconnect();

console.log('✅ ankur@gmail.com is now synchronized into BOTH vegking and vegimart databases with password123 and is_verified=1');
process.exit(0);
