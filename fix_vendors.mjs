import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://krishna6maurya_db_user:hello123@ac-ahx3ldr-shard-00-00.44cwlmc.mongodb.net:27017,ac-ahx3ldr-shard-00-01.44cwlmc.mongodb.net:27017,ac-ahx3ldr-shard-00-02.44cwlmc.mongodb.net:27017/vegking?ssl=true&replicaSet=atlas-jx1nm9-shard-0&authSource=admin&retryWrites=true&w=majority';

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;

const before = await db.collection('vendors').findOne({ email: 'vendor11@vegking.com' });
console.log('Vendor Before:', before);

const hashedPassword = await bcrypt.hash('password123', 10);
console.log('Hashed Password:', hashedPassword);

const updateResult = await db.collection('vendors').updateMany({}, { $set: { password: hashedPassword } });
console.log('Update Result:', updateResult);

const after = await db.collection('vendors').findOne({ email: 'vendor11@vegking.com' });
console.log('Vendor After:', after);

const isMatch = await bcrypt.compare('password123', after.password);
console.log('Verification Match:', isMatch);

process.exit(0);
