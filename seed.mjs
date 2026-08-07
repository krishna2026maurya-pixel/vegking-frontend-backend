// seed.mjs - MongoDB Atlas Sample Data Seeder
// Run: node seed.mjs

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import crypto from 'crypto';

// Load .env.local manually
const envContent = readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => { const [k, ...v] = line.split('='); return [k.trim(), v.join('=').trim()]; })
);
const MONGODB_URI = envVars.MONGODB_URI;

console.log('🔗 Connecting to MongoDB Atlas...');
await mongoose.connect(MONGODB_URI);
console.log('✅ Connected!\n');

const db = mongoose.connection.db;

// ─────────────────────────────────────────────────────────────────────────────
// DROP existing collections
// ─────────────────────────────────────────────────────────────────────────────
const colls = ['vendors', 'products', 'orders', 'deliveryboys', 'users', 'categories', 'categorytypes', 'brands', 'coupons', 'banners', 'addresses', 'orderitems', 'carts', 'wishlists'];
for (const c of colls) {
  try { await db.collection(c).drop(); } catch { }
}
console.log('🗑️  Old data cleared\n');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const cities = ['Mumbai', 'Delhi', 'Pune', 'Bangalore', 'Hyderabad', 'Chennai', 'Jaipur', 'Lucknow', 'Ahmedabad', 'Surat'];
const indianNames = ['Rahul Kumar', 'Amit Sharma', 'Priya Singh', 'Suresh Das', 'Neha Gupta', 'Vijay Patel', 'Anita Rao', 'Rajesh Verma', 'Sunita Joshi', 'Manoj Tiwari', 'Kavita Mehta', 'Deepak Nair', 'Pooja Yadav', 'Sanjay Bose', 'Rekha Iyer'];
const shopNames = ['Fresh Farm Mart', 'Green Grocers', 'Nature\'s Basket', 'Veggie World', 'Organic Corner', 'Daily Fresh', 'Farm to Fork', 'Pure Veggies', 'Harvest Hub', 'Field Fresh'];
const vehicleTypes = ['Bike', 'Scooter', 'Cycle', 'Van'];
const today = new Date();
const daysAgo = (n) => new Date(today - n * 86400000);

// ─────────────────────────────────────────────────────────────────────────────
// 1. VENDORS (20)
// ─────────────────────────────────────────────────────────────────────────────
const vendors = Array.from({ length: 20 }, (_, i) => ({
  full_name: indianNames[i % indianNames.length],
  email: `vendor${i + 1}@vegimart.com`,
  mobile_number: `98${randInt(10000000, 99999999)}`,
  shop_name: shopNames[i % shopNames.length] + (i >= shopNames.length ? ` ${Math.floor(i / shopNames.length) + 1}` : ''),
  city: rand(cities),
  address: `${randInt(1, 999)} Main Road, ${rand(cities)}`,
  is_verified: rand(['1', '1', '1', '0']),
  is_bestseller: rand(['1', '0', '0']),
  wallet_balance: randFloat(0, 5000),
  is_active: '1',
  shop_image: null,
  created_at: daysAgo(randInt(10, 365)).toISOString(),
}));
const insertedVendors = await db.collection('vendors').insertMany(vendors);
console.log(`✅ ${vendors.length} Vendors inserted`);
const vendorIds = Object.values(insertedVendors.insertedIds);

// ─────────────────────────────────────────────────────────────────────────────
// 2. CATEGORY TYPES (4)
// ─────────────────────────────────────────────────────────────────────────────
const categoryTypeList = [
  { name: 'Fresh Vegetables', slug: 'fresh-vegetables', image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&auto=format&fit=crop&q=80', sort_order: 1 },
  { name: 'Fresh Fruits', slug: 'fresh-fruits', image: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&auto=format&fit=crop&q=80', sort_order: 2 },
  { name: 'Dairy Products', slug: 'dairy-products', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&auto=format&fit=crop&q=80', sort_order: 3 },
  { name: 'Organic & Herbs', slug: 'organic-herbs', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80', sort_order: 4 },
];
const categoryTypes = categoryTypeList.map(ct => ({ ...ct, is_active: '1', created_at: daysAgo(randInt(30, 300)).toISOString() }));
const insertedTypes = await db.collection('categorytypes').insertMany(categoryTypes);
console.log(`✅ ${categoryTypes.length} Category Types inserted`);
const typeIds = insertedTypes.insertedIds;

// Map name to inserted ID
const typeMap = {};
categoryTypes.forEach((ct, i) => {
  typeMap[ct.name] = typeIds[i].toString();
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATEGORIES (All 9 categories to be displayed in the Navbar dropdown)
// ─────────────────────────────────────────────────────────────────────────────
const categoryNames = [
  'Vegetables',
  'Exotic Vegetables',
  'Leafy Greens',
  'Root Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Herbs & Spices',
  'Organic Daals',
  'Seeds'
];
const categoryImageMap = {
  'Vegetables': 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&auto=format&fit=crop&q=80',
  'Exotic Vegetables': 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&auto=format&fit=crop&q=80',
  'Leafy Greens': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80',
  'Root Vegetables': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80',
  'Fruits': 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&auto=format&fit=crop&q=80',
  'Dairy & Eggs': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&auto=format&fit=crop&q=80',
  'Herbs & Spices': 'https://images.unsplash.com/photo-1596003906949-67221c37965c?w=400&auto=format&fit=crop&q=80',
  'Organic Daals': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
  'Seeds': 'https://images.unsplash.com/photo-1502741126161-b048400d085d?w=400&auto=format&fit=crop&q=80'
};

const categoryToTypeMap = {
  'Vegetables': 'Fresh Vegetables',
  'Exotic Vegetables': 'Fresh Vegetables',
  'Leafy Greens': 'Fresh Vegetables',
  'Root Vegetables': 'Fresh Vegetables',
  'Fruits': 'Fresh Fruits',
  'Dairy & Eggs': 'Dairy Products',
  'Herbs & Spices': 'Organic & Herbs',
  'Organic Daals': 'Organic & Herbs',
  'Seeds': 'Organic & Herbs'
};

const categories = categoryNames.map((name, i) => {
  const typeName = categoryToTypeMap[name];
  const cat_type_id = typeMap[typeName] || '';
  return {
    name,
    slug: name.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-'),
    image: categoryImageMap[name] || null,
    cat_type_id,
    is_active: '1',
    sort_order: i + 1,
    created_at: daysAgo(randInt(30, 300)).toISOString(),
  };
});
const insertedCats = await db.collection('categories').insertMany(categories);
console.log(`✅ ${categories.length} Categories inserted`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. BRANDS (6)
// ─────────────────────────────────────────────────────────────────────────────
const brandNames = ['Farm Fresh', 'Organic India', 'Nature\'s Best', 'Green Leaf', 'Pure Harvest', 'Golden Fields'];
const brandLogoMap = {
  'Farm Fresh': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=200&auto=format&fit=crop&q=80',
  'Organic India': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&auto=format&fit=crop&q=80',
  'Nature\'s Best': 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=200&auto=format&fit=crop&q=80',
  'Green Leaf': 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=200&auto=format&fit=crop&q=80',
  'Pure Harvest': 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=200&auto=format&fit=crop&q=80',
  'Golden Fields': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&auto=format&fit=crop&q=80'
};
const brands = brandNames.map((name, i) => ({
  name,
  logo: brandLogoMap[name] || null,
  is_active: '1',
  created_at: daysAgo(randInt(30, 300)).toISOString(),
}));
await db.collection('brands').insertMany(brands);
console.log(`✅ ${brands.length} Brands inserted`);

// ─────────────────────────────────────────────────────────────────────────────
// 5. PRODUCTS (Mapped with category = sub-category, subcategory = main-category)
// ─────────────────────────────────────────────────────────────────────────────
const productList = [
  // ── Vegetables ──────────────────────────────────────────────────────────────
  { name: 'Carrot (Gajar)', category: 'Root Vegetables', subcategory: 'Vegetables', unit: '500 g', mrp: 40, sp: 32, is_bestseller: true, imgId: 'photo-1598170845058-32b9d6a5da37' },
  { name: 'Green Cucumber (Kakdi)', category: 'Root Vegetables', subcategory: 'Vegetables', unit: '500 g', mrp: 54, sp: 43, is_bestseller: false, imgId: 'photo-1604928141064-207ec669695a' },
  { name: 'Cabbage (Kobi)', category: 'Leafy Greens', subcategory: 'Vegetables', unit: '1 pc', mrp: 30, sp: 24, is_bestseller: false, imgId: 'photo-1581447100512-68b5c1013d22' },
  { name: 'Capsicum (Simla Marcha)', category: 'Vegetables', subcategory: 'Vegetables', unit: '250 g', mrp: 35, sp: 28, is_bestseller: false, imgId: 'photo-1583089892943-e02e5b97d07e' },
  { name: 'Potato (Bateta)', category: 'Root Vegetables', subcategory: 'Vegetables', unit: '1 kg', mrp: 34, sp: 28, is_bestseller: true, imgId: 'photo-1518977676601-b53f82aba655' },
  { name: 'Onion (Dungdi)', category: 'Root Vegetables', subcategory: 'Vegetables', unit: '1 kg', mrp: 43, sp: 37, is_bestseller: true, imgId: 'photo-1618512457222-1d5757d54e42' },
  { name: 'French Beans (Fansi)', category: 'Vegetables', subcategory: 'Vegetables', unit: '250 g', mrp: 83, sp: 68, is_bestseller: false, imgId: 'photo-1567375695-300649067da6' },
  { name: 'Spinach (Palak)', category: 'Leafy Greens', subcategory: 'Vegetables', unit: '250 g', mrp: 25, sp: 20, is_bestseller: false, imgId: 'photo-1576045057995-568f588f82fb' },
  { name: 'Stuffed Vegetables (Bharela Shaak)', category: 'Vegetables', subcategory: 'Vegetables', unit: '500 g', mrp: 60, sp: 48, is_bestseller: false, imgId: 'photo-1592417817098-8f3d6eb19675' },
  { name: 'Hybrid Tomato (Tameta)', category: 'Vegetables', subcategory: 'Vegetables', unit: '500 g', mrp: 54, sp: 43, is_bestseller: true, imgId: 'photo-1595855759920-86582396756a' },
  { name: 'Green Tomato (Leela Tameta)', category: 'Vegetables', subcategory: 'Vegetables', unit: '500 g', mrp: 40, sp: 32, is_bestseller: false, imgId: 'photo-1564758788915-d419b49bbbb7' },
  { name: 'Cauliflower (Fulaver)', category: 'Vegetables', subcategory: 'Vegetables', unit: '1 pc', mrp: 45, sp: 36, is_bestseller: false, imgId: 'photo-1568584711075-3d021a7c3ce3' },
  { name: 'Kaddu (Kolku / Pumpkin)', category: 'Vegetables', subcategory: 'Vegetables', unit: '1 kg', mrp: 35, sp: 28, is_bestseller: false, imgId: 'photo-1506806732259-39c2d0268443' },
  { name: 'Saragava (Drumstick)', category: 'Vegetables', subcategory: 'Vegetables', unit: '250 g', mrp: 30, sp: 24, is_bestseller: false, imgId: 'photo-1608797178974-15b35a61d121' },
  { name: 'Beetroot (Beet)', category: 'Root Vegetables', subcategory: 'Vegetables', unit: '500 g', mrp: 25, sp: 20, is_bestseller: false, imgId: 'photo-1528137871218-7f487e6a8b63' },
  { name: 'Potato Wafer', category: 'Vegetables', subcategory: 'Vegetables', unit: '100 g', mrp: 30, sp: 25, is_bestseller: false, imgId: 'photo-1566478989037-eec170784d0b' },
  { name: 'Ravya (Ravaiya / Small Brinjal)', category: 'Vegetables', subcategory: 'Vegetables', unit: '500 g', mrp: 40, sp: 32, is_bestseller: false, imgId: 'photo-1590301157890-4810ed352733' },
  { name: 'Picador Chilli', category: 'Vegetables', subcategory: 'Vegetables', unit: '150 g', mrp: 35, sp: 28, is_bestseller: false, imgId: 'photo-1588252303782-cb80119abd6d' },
  { name: 'Loki (Dudhi / Bottle Gourd)', category: 'Vegetables', subcategory: 'Vegetables', unit: '1 pc', mrp: 30, sp: 24, is_bestseller: false, imgId: 'photo-1592417817098-8f3d6eb19675' },
  { name: 'Lady Finger (Bhinda)', category: 'Vegetables', subcategory: 'Vegetables', unit: '250 g', mrp: 25, sp: 20, is_bestseller: true, imgId: 'photo-1627914562479-7a3b3469a536' },
  { name: 'Galka (Sponge Gourd)', category: 'Vegetables', subcategory: 'Vegetables', unit: '500 g', mrp: 35, sp: 28, is_bestseller: false, imgId: 'photo-1592417817098-8f3d6eb19675' },
  { name: 'Palwar (Parval)', category: 'Vegetables', subcategory: 'Vegetables', unit: '250 g', mrp: 40, sp: 32, is_bestseller: false, imgId: 'photo-1592417817098-8f3d6eb19675' },
  { name: 'Gavar (Guvar / Cluster Beans)', category: 'Vegetables', subcategory: 'Vegetables', unit: '250 g', mrp: 35, sp: 28, is_bestseller: false, imgId: 'photo-1567375695-300649067da6' },
  { name: 'Red / Yellow Capsicum', category: 'Vegetables', subcategory: 'Vegetables', unit: '2 pcs', mrp: 120, sp: 99, is_bestseller: false, imgId: 'photo-1601004890684-d8cbf643f5f2' },
  { name: 'Broccoli', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '1 pc', mrp: 80, sp: 65, is_bestseller: true, imgId: 'photo-1459411621453-7b03977f4bfc' },
  { name: 'Zucchini (Zugni)', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '500 g', mrp: 50, sp: 40, is_bestseller: false, imgId: 'photo-1509358271058-acd22cc93898' },
  { name: 'Celery (Salary)', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '250 g', mrp: 40, sp: 32, is_bestseller: false, imgId: 'photo-1610832958506-ee563361f17e' },
  { name: 'Parsley (Parsly)', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '100 g', mrp: 30, sp: 24, is_bestseller: false, imgId: 'photo-1592417817098-8fd3d9eb14a5' },
  { name: 'Basil', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '50 g', mrp: 25, sp: 20, is_bestseller: false, imgId: 'photo-1618220179428-22790b461013' },
  { name: 'Baby Corn', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '200 g', mrp: 40, sp: 32, is_bestseller: false, imgId: 'photo-1551754655-cd27e38d2076' },
  { name: 'Lettuce', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '1 pc', mrp: 50, sp: 40, is_bestseller: false, imgId: 'photo-1622206194165-af55f028a3f9' },
  { name: 'Red Cabbage', category: 'Leafy Greens', subcategory: 'Vegetables', unit: '1 pc', mrp: 60, sp: 48, is_bestseller: false, imgId: 'photo-1611080626919-7cf5a9dbab5b' },
  { name: 'American Corn', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '2 pcs', mrp: 40, sp: 32, is_bestseller: false, imgId: 'photo-1551754655-cd27e38d2076' },
  { name: 'Green Peas (Vatana)', category: 'Vegetables', subcategory: 'Vegetables', unit: '500 g', mrp: 50, sp: 40, is_bestseller: false, imgId: 'photo-1587570256529-6a869e4d416b' },
  { name: 'Mushroom', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '200 g', mrp: 60, sp: 48, is_bestseller: true, imgId: 'photo-1534422298391-e4f8c172dddb' },
  { name: 'Leek', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '250 g', mrp: 40, sp: 32, is_bestseller: false, imgId: 'photo-1604928127065-22485f401620' },
  { name: 'Bok Choy (Popchau)', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '250 g', mrp: 50, sp: 40, is_bestseller: false, imgId: 'photo-1608686214566-b9b5f884fbc9' },
  { name: 'Cherry Tomato', category: 'Exotic Vegetables', subcategory: 'Vegetables', unit: '250 g', mrp: 60, sp: 48, is_bestseller: false, imgId: 'photo-1590301157890-4810ed352733' },
  { name: 'Banana Leaf', category: 'Vegetables', subcategory: 'Vegetables', unit: '5 pcs', mrp: 30, sp: 24, is_bestseller: false, imgId: 'photo-1528825871115-3581a5387919' },

  // ── Herbs & Spices ───────────────────────────────────────────────────────────
  { name: 'Green Chilli (Lila Marcha)', category: 'Herbs & Spices', subcategory: 'Vegetables', unit: '100 g', mrp: 26, sp: 21, is_bestseller: true, imgId: 'photo-1601004890684-d8cbf643f5f2' },
  { name: 'Surati Chilli (Surti Marcha)', category: 'Herbs & Spices', subcategory: 'Vegetables', unit: '100 g', mrp: 30, sp: 25, is_bestseller: false, imgId: 'photo-1588252303782-cb80119abd6d' },
  { name: 'Coriander (Kothmir)', category: 'Herbs & Spices', subcategory: 'Vegetables', unit: '100 g', mrp: 20, sp: 15, is_bestseller: false, imgId: 'photo-1608797178974-15b35a61d121' },
  { name: 'Ginger (Adu)', category: 'Herbs & Spices', subcategory: 'Vegetables', unit: '200 g', mrp: 64, sp: 56, is_bestseller: true, imgId: 'photo-1615485500704-8e990f9900f7' },
  { name: 'Lemon (Limbu)', category: 'Herbs & Spices', subcategory: 'Vegetables', unit: '200 g', mrp: 26, sp: 20, is_bestseller: false, imgId: 'photo-1590502593747-42a996133562' },
  { name: 'Mint Leaves (Pudina)', category: 'Herbs & Spices', subcategory: 'Vegetables', unit: '100 g', mrp: 28, sp: 23, is_bestseller: false, imgId: 'photo-1628556270448-4d4e4148e1b1' },
  { name: 'Spring Onion (Lila Dungli)', category: 'Herbs & Spices', subcategory: 'Vegetables', unit: '250 g', mrp: 30, sp: 24, is_bestseller: false, imgId: 'photo-1508747703725-719777637510' },
  { name: 'Garlic (Lasan)', category: 'Herbs & Spices', subcategory: 'Vegetables', unit: '250 g', mrp: 60, sp: 50, is_bestseller: true, imgId: 'photo-1540148426945-6cf22a6b2383' },
  { name: 'Lemon Grass', category: 'Herbs & Spices', subcategory: 'Vegetables', unit: '100 g', mrp: 20, sp: 15, is_bestseller: false, imgId: 'photo-1560806887-1e4cd0b6cbd6' },

  // ── Fruits ───────────────────────────────────────────────────────────────────
  { name: 'Apple (Safarchand)', category: 'Fruits', subcategory: 'Fruits', unit: '1 kg', mrp: 220, sp: 180, is_bestseller: true, imgId: 'photo-1619546813926-a78fa6372cd2' },
  { name: 'Orange (Santara)', category: 'Fruits', subcategory: 'Fruits', unit: '1 kg', mrp: 90, sp: 75, is_bestseller: false, imgId: 'photo-1611080626919-7cf5a9dbab5b' },
  { name: 'Pineapple', category: 'Fruits', subcategory: 'Fruits', unit: '1 pc', mrp: 80, sp: 65, is_bestseller: false, imgId: 'photo-1550258987-190a2d41a8ba' },
  { name: 'Watermelon (Tarbuj)', category: 'Fruits', subcategory: 'Fruits', unit: '1 pc', mrp: 100, sp: 80, is_bestseller: true, imgId: 'photo-1589984662646-e7b2e4962f18' },
  { name: 'Banana (Kela)', category: 'Fruits', subcategory: 'Fruits', unit: '1 Dozen', mrp: 60, sp: 48, is_bestseller: true, imgId: 'photo-1571771894821-ce9b6c11b08e' },
  { name: 'Grapes (Draksh)', category: 'Fruits', subcategory: 'Fruits', unit: '500 g', mrp: 100, sp: 80, is_bestseller: false, imgId: 'photo-1537640538966-79f369143f8f' },
  { name: 'Kiwi', category: 'Fruits', subcategory: 'Fruits', unit: '3 pcs', mrp: 120, sp: 99, is_bestseller: false, imgId: 'photo-1585241936222-6b80119abd6d' },
  { name: 'Chiku', category: 'Fruits', subcategory: 'Fruits', unit: '500 g', mrp: 60, sp: 48, is_bestseller: false, imgId: 'photo-1596797038530-2c107229654b' },
  { name: 'Anar (Dadam)', category: 'Fruits', subcategory: 'Fruits', unit: '1 kg', mrp: 180, sp: 150, is_bestseller: true, imgId: 'photo-1601004890684-d8cbf643f5f2' },
  { name: 'Papaya (Papaiya)', category: 'Fruits', subcategory: 'Fruits', unit: '1 pc', mrp: 80, sp: 65, is_bestseller: false, imgId: 'photo-1526318896980-cf78c088247c' },
  { name: 'Mango (Keri)', category: 'Fruits', subcategory: 'Fruits', unit: '1 kg', mrp: 250, sp: 199, is_bestseller: true, imgId: 'photo-1553279768-865429fa0078' },

  // ── Dairy & Eggs ─────────────────────────────────────────────────────────────
  { name: 'Fresh Full Cream Milk', category: 'Dairy & Eggs', subcategory: 'Dairy & Eggs', unit: '1 Litre', mrp: 65, sp: 58, is_bestseller: true, imgId: 'photo-1563636619-e9143da7973b' },
  { name: 'Desi Cow Ghee', category: 'Dairy & Eggs', subcategory: 'Dairy & Eggs', unit: '500 ml', mrp: 950, sp: 849, is_bestseller: false, imgId: 'photo-1620706857370-e1b9770e8bb1' },
  { name: 'Homemade Paneer', category: 'Dairy & Eggs', subcategory: 'Dairy & Eggs', unit: '200 g', mrp: 110, sp: 95, is_bestseller: true, imgId: 'photo-1631452180539-96eca7d73c8c' },
  { name: 'Natural Curd (Dahi)', category: 'Dairy & Eggs', subcategory: 'Dairy & Eggs', unit: '400 g', mrp: 55, sp: 48, is_bestseller: false, imgId: 'photo-1488477181946-6428a0291777' },
  { name: 'Fresh White Butter', category: 'Dairy & Eggs', subcategory: 'Dairy & Eggs', unit: '100 g', mrp: 85, sp: 72, is_bestseller: false, imgId: 'photo-1589985270826-4b7bb135bc9d' },
  { name: 'Mozzarella Cheese', category: 'Dairy & Eggs', subcategory: 'Dairy & Eggs', unit: '200 g', mrp: 180, sp: 155, is_bestseller: false, imgId: 'photo-1486297678162-eb2a19b0a32d' },

  // ── Seeds ────────────────────────────────────────────────────────────────────
  { name: 'Chia Seeds', category: 'Seeds', subcategory: 'Seeds', unit: '200 g', mrp: 250, sp: 199, is_bestseller: false, imgId: 'photo-1502741126161-b048400d085d' },
  { name: 'Sunflower Seeds', category: 'Seeds', subcategory: 'Seeds', unit: '200 g', mrp: 120, sp: 99, is_bestseller: false, imgId: 'photo-1592417817098-8f3d6eb19675' },
  { name: 'Pumpkin Seeds', category: 'Seeds', subcategory: 'Seeds', unit: '150 g', mrp: 180, sp: 149, is_bestseller: false, imgId: 'photo-1574323347407-f5e1ad6d020b' },

  // ── Organic Daals ────────────────────────────────────────────────────────────
  { name: 'Arhar Dal (Toor Dal)', category: 'Organic Daals', subcategory: 'Organic Daals', unit: '1 kg', mrp: 165, sp: 140, is_bestseller: true, imgId: 'photo-1615485290382-441e4d049cb5' },
  { name: 'Masoor Dal (Red Lentil)', category: 'Organic Daals', subcategory: 'Organic Daals', unit: '1 kg', mrp: 140, sp: 118, is_bestseller: false, imgId: 'photo-1542838132-92c53300491e' },
  { name: 'Moong Dal (Split Green)', category: 'Organic Daals', subcategory: 'Organic Daals', unit: '1 kg', mrp: 155, sp: 130, is_bestseller: false, imgId: 'photo-1585032226651-759b368d7246' }
];

// Product Image Map with clear backgrounds (w=500, plain backgrounds)
const buildUnsplashUrl = (id) => `https://images.unsplash.com/${id}?w=500&auto=format&fit=crop&q=80`;

const customImages = {
  'Spinach (Palak)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785933747/vegimart_products/cs06teana2dvii0xfvd1.jpg',
  'Cabbage (Kobi)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785933749/vegimart_products/q2znuxsxxirvbzydrp42.jpg',
  'Red Cabbage': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785933750/vegimart_products/f8gy8abw3dzf3awqqzwy.jpg',
  'Beetroot (Beet)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785934192/vegimart_products/n0ldedvd6burco9ffnj8.jpg',
  'Onion (Dungdi)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785934193/vegimart_products/hki8xyupw9osvax77ute.jpg',
  'Green Cucumber (Kakdi)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785934194/vegimart_products/d0yt5vbfvzssgh9b3c64.jpg',
  'Homemade Paneer': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785934195/vegimart_products/bz5j2zxuitjmmifwshbs.jpg',
  'Desi Cow Ghee': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785934196/vegimart_products/c3cvpl5fmil6prjxkssi.jpg',
  'Moong Dal (Split Green)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785934197/vegimart_products/p3bqomekrrvrtobxbgxi.jpg',
  'Masoor Dal (Red Lentil)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785934198/vegimart_products/ykq0g4ffmcvjl3egrntb.jpg',
  'Arhar Dal (Toor Dal)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785934199/vegimart_products/rco80qlgh06qkaiam5e0.jpg',
  'Sunflower Seeds': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785934200/vegimart_products/hkhdm7r4upe4qshhu0ep.jpg',
  'Chia Seeds': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785934201/vegimart_products/ukgto8hnh55u6nqxflgh.jpg',
  'Lady Finger (Bhinda)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785936305/vegimart/lady_finger_bhinda.jpg',
  'Gavar (Guvar / Cluster Beans)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785936307/vegimart/gavar_cluster_beans.jpg',
  'Palwar (Parval)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785936308/vegimart/palwar_parval.jpg',
  'Galka (Sponge Gourd)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785936309/vegimart/galka_sponge_gourd.jpg',
  'Cherry Tomato': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785936310/vegimart/cherry_tomato.jpg',
  'Bok Choy (Popchau)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785936311/vegimart/bok_choy_popchau.jpg',
  'Parsley (Parsly)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785936311/vegimart/parsley_parsly.jpg',
  'Leek': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785936312/vegimart/leek.jpg',
  'Mushroom': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785936313/vegimart/mushroom.jpg',
  'Lemon Grass': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785936314/vegimart/lemon_grass.jpg',
  'Banana Leaf': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937279/vegimart/banana_leaf.jpg',
  'Hybrid Tomato (Tameta)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937280/vegimart/hybrid_tomato.jpg',
  'Saragava (Drumstick)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937446/vegimart/saragava_drumstick.jpg',
  'Kaddu (Kolku / Pumpkin)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937965/vegimart/kaddu_pumpkin.png',
  'Cauliflower (Fulaver)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937412/vegimart/cauliflower_fulaver.jpg',
  'Green Tomato (Leela Tameta)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937412/vegimart/green_tomato.jpg',
  'Loki (Dudhi / Bottle Gourd)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937413/vegimart/loki_bottle_gourd.jpg',
  'Stuffed Vegetables (Bharela Shaak)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937414/vegimart/stuffed_vegetables.jpg',
  'French Beans (Fansi)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937415/vegimart/french_beans.jpg',
  'Capsicum (Simla Marcha)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937416/vegimart/capsicum_simla_marcha.jpg',
  'Green Peas (Vatana)': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937417/vegimart/green_peas_vatana.jpg',
  'Red / Yellow Capsicum': 'https://res.cloudinary.com/df7gwzlj0/image/upload/v1785937418/vegimart/red_yellow_capsicum.jpg',
};

const products = productList.map((p, i) => {
  const typeName = categoryToTypeMap[p.category] || 'Fresh Vegetables';
  const cat_type_id = typeMap[typeName] || '';
  const imgUrl = customImages[p.name] || buildUnsplashUrl(p.imgId);

  return {
    product_name: p.name,
    vendor_id: rand(vendorIds),
    vendor_shop_name: rand(shopNames),
    brand: rand(brandNames),
    cat_type_id,
    category: p.category,
    subcategory: p.subcategory,
    quantity: p.unit,
    mrp: p.mrp,
    selling_price: p.sp,
    total_amt: p.sp,
    gst: rand([0, 5, 12]),
    stock_status: 1, // Set to 1 so that products are mapped as In-Stock (stock = 99) in Next.js API
    product_image: imgUrl,
    images: [imgUrl],
    is_active: '1',
    is_bestseller: p.is_bestseller ? '1' : '0',
    description: `Fresh ${p.name} sourced directly from verified local farms. Cleaned, graded, and packed under strict hygiene conditions.`,
    created_at: daysAgo(randInt(1, 180)).toISOString(),
  };
});

const insertedProducts = await db.collection('products').insertMany(products);
console.log(`✅ ${products.length} Products inserted`);

// ─────────────────────────────────────────────────────────────────────────────
// 6. USERS (15)
// ─────────────────────────────────────────────────────────────────────────────
const JWT_SECRET = 'vegimart-secure-secret-key-2026';
const defaultHashedPassword = crypto.createHmac('sha256', JWT_SECRET).update('123456').digest('hex');

const users = Array.from({ length: 14 }, (_, i) => ({
  name: indianNames[i],
  mobile_no: `97${randInt(10000000, 99999999)}`,
  mobile_number: `97${randInt(10000000, 99999999)}`,
  email: `user${i + 1}@gmail.com`,
  city: rand(cities),
  wallet_balance: randFloat(0, 500),
  password: defaultHashedPassword,
  is_active: '1',
  created_at: daysAgo(randInt(5, 200)).toISOString(),
}));

users.push({
  name: 'Krishna Kumar',
  mobile_no: '9999999999',
  mobile_number: '9999999999',
  email: 'krishna@vegimart.com',
  city: 'Mumbai',
  wallet_balance: 1000,
  password: defaultHashedPassword,
  is_active: '1',
  created_at: new Date().toISOString(),
});
const insertedUsers = await db.collection('users').insertMany(users);
console.log(`✅ ${users.length} Users inserted`);
const userIds = Object.values(insertedUsers.insertedIds);

// ─────────────────────────────────────────────────────────────────────────────
// 7. ADDRESSES
// ─────────────────────────────────────────────────────────────────────────────
const addresses = [];
userIds.forEach(userId => {
  addresses.push({
    user_id: userId,
    label: 'Home',
    name: rand(indianNames),
    mobile: `97${randInt(10000000, 99999999)}`,
    address_line: `${randInt(1, 999)} MG Road`,
    city: rand(cities),
    state: 'Maharashtra',
    pincode: `${randInt(400001, 400099)}`,
    is_default: true,
    created_at: daysAgo(randInt(10, 100)).toISOString(),
  });
  if (Math.random() > 0.5) {
    addresses.push({
      user_id: userId,
      label: 'Work',
      name: rand(indianNames),
      mobile: `97${randInt(10000000, 99999999)}`,
      address_line: `${randInt(1, 999)} IT Park`,
      city: rand(cities),
      state: 'Maharashtra',
      pincode: `${randInt(400001, 400099)}`,
      is_default: false,
      created_at: daysAgo(randInt(10, 100)).toISOString(),
    });
  }
});
await db.collection('addresses').insertMany(addresses);
console.log(`✅ ${addresses.length} Addresses inserted`);

// ─────────────────────────────────────────────────────────────────────────────
// 8. DELIVERY BOYS (10)
// ─────────────────────────────────────────────────────────────────────────────
const deliveryBoys = Array.from({ length: 10 }, (_, i) => ({
  name: `Delivery ${indianNames[i]}`,
  mobile_number: `96${randInt(10000000, 99999999)}`,
  email: `delivery${i + 1}@vegimart.com`,
  vehicle_type: rand(vehicleTypes),
  vehicle_number: `MH${randInt(10, 99)}-${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}-${randInt(1000, 9999)}`,
  is_verified: rand(['1', '1', '0']),
  is_active: rand(['1', '1', '0']),
  wallet_balance: randFloat(0, 2000),
  city: rand(cities),
  created_at: daysAgo(randInt(10, 200)).toISOString(),
}));
await db.collection('deliveryboys').insertMany(deliveryBoys);
console.log(`✅ ${deliveryBoys.length} Delivery Boys inserted`);

// ─────────────────────────────────────────────────────────────────────────────
// 9. ORDERS & ORDERITEMS (40)
// ─────────────────────────────────────────────────────────────────────────────
const statusOptions = [0, 1, 2, 3, 4, 5];
const paymentMethods = ['COD', 'ONLINE'];
const paymentStatuses = ['pending', 'completed', 'failed'];

const orders = [];
const orderItems = [];

for (let i = 0; i < 40; i++) {
  const orderId = new mongoose.Types.ObjectId();
  const method = rand(paymentMethods);
  const total = randFloat(100, 2000);
  const orderDate = daysAgo(randInt(0, 90));
  const numItems = randInt(1, 4);
  const itemIds = [];

  for (let j = 0; j < numItems; j++) {
    const orderItemId = new mongoose.Types.ObjectId();
    const prodIndex = randInt(0, products.length - 1);
    const prodId = insertedProducts.insertedIds[prodIndex];
    const prodName = products[prodIndex].product_name;
    const prodImg = products[prodIndex].product_image;

    const qty = randInt(1, 3);
    const price = randFloat(20, 300);

    orderItems.push({
      _id: orderItemId,
      order_id: orderId,
      product_id: prodId,
      product_name: prodName,
      qty: qty,
      price: price,
      image: prodImg || '',
      created_at: orderDate.toISOString(),
      updated_at: orderDate.toISOString()
    });

    itemIds.push(orderItemId);
  }

  orders.push({
    _id: orderId,
    order_number: `ORD-${orderDate.getFullYear()}-${String(i + 1).padStart(4, '0')}`,
    user_id: rand(userIds),
    customer_mobile: `97${randInt(10000000, 99999999)}`,
    total_amount: total,
    payment_method: method,
    payment_status: method === 'COD' ? rand(['pending', 'completed']) : rand(paymentStatuses),
    status: rand(statusOptions),
    city: rand(cities),
    delivery_address: `${randInt(1, 999)} ${rand(['MG Road', 'Ring Road', 'Civil Lines', 'New Market'])}, ${rand(cities)}`,
    items: itemIds,
    created_at: orderDate.toISOString(),
    updated_at: orderDate.toISOString()
  });
}

await db.collection('orderitems').insertMany(orderItems);
console.log(`✅ ${orderItems.length} Order Items inserted`);

await db.collection('orders').insertMany(orders);
console.log(`✅ ${orders.length} Orders inserted`);

// ─────────────────────────────────────────────────────────────────────────────
// 10. COUPONS (5)
// ─────────────────────────────────────────────────────────────────────────────
const coupons = [
  { code: 'FRESH10', discount_type: 'percent', discount_value: 10, min_order: 200, max_uses: 100, used_count: randInt(10, 80), is_active: '1', expires_at: daysAgo(-30).toISOString() },
  { code: 'SAVE50', discount_type: 'flat', discount_value: 50, min_order: 500, max_uses: 50, used_count: randInt(5, 45), is_active: '1', expires_at: daysAgo(-15).toISOString() },
  { code: 'ORGANIC20', discount_type: 'percent', discount_value: 20, min_order: 300, max_uses: 30, used_count: randInt(0, 25), is_active: '1', expires_at: daysAgo(-60).toISOString() },
  { code: 'WELCOME100', discount_type: 'flat', discount_value: 100, min_order: 400, max_uses: 200, used_count: randInt(50, 180), is_active: '0', expires_at: daysAgo(5).toISOString() },
  { code: 'VEGI15', discount_type: 'percent', discount_value: 15, min_order: 250, max_uses: 75, used_count: randInt(0, 50), is_active: '1', expires_at: daysAgo(-45).toISOString() },
];
await db.collection('coupons').insertMany(coupons);
console.log(`✅ ${coupons.length} Coupons inserted`);

// ─────────────────────────────────────────────────────────────────────────────
// 11. BANNERS (4)
// ─────────────────────────────────────────────────────────────────────────────
const banners = [
  { title: 'Fresh Vegetables Sale', subtitle: 'Up to 30% off on all vegetables', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80', link: '/shop', is_active: '1', sort_order: 1 },
  { title: 'New Season Fruits', subtitle: 'Mangoes, Watermelons & more', image: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&auto=format&fit=crop&q=80', link: '/fruits', is_active: '1', sort_order: 2 },
  { title: 'Organic Range', subtitle: 'Chemical-free, farm fresh', image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80', link: '/organic', is_active: '1', sort_order: 3 },
  { title: 'Free Delivery', subtitle: 'On orders above ₹299', image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80', link: '/shop', is_active: '0', sort_order: 4 },
];
await db.collection('banners').insertMany(banners);
console.log(`✅ ${banners.length} Banners inserted`);

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 Seed complete! MongoDB Atlas में data import हो गया:');
console.log('   • 20 Vendors');
console.log(`   • ${products.length} Products`);
console.log('   • 40 Orders');
console.log(`   • ${orderItems.length} Order Items`);
console.log(`   • ${users.length} Users`);
console.log(`   • ${addresses.length} Addresses`);
console.log('   • 10 Delivery Boys');
console.log(`   • ${categories.length} Categories`);
console.log(`   • ${categoryTypes.length} Category Types`);
console.log(`   • ${brandNames.length} Brands`);
console.log('   • 5 Coupons');
console.log('   • 4 Banners');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

await mongoose.disconnect();
