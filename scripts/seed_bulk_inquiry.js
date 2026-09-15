const fs = require('fs');
const mongoose = require('mongoose');

const content = fs.readFileSync('.env', 'utf8');
const match = content.match(/MONGODB_URI=(.+)/);
const uri = match[1].trim();

async function main() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', new mongoose.Schema({}, { strict: false }));
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const NegotiationSession = mongoose.models.NegotiationSession || mongoose.model('NegotiationSession', new mongoose.Schema({}, { strict: false }));
  const NegotiationMessage = mongoose.models.NegotiationMessage || mongoose.model('NegotiationMessage', new mongoose.Schema({}, { strict: false }));

  // Find Harvest Hub 2
  const vendor = await Vendor.findOne({ email: 'vendor19@vegking.com' }).lean();
  if (!vendor) {
    console.error('Vendor not found');
    await mongoose.disconnect();
    return;
  }
  console.log('Found vendor:', vendor.shop_name, vendor._id);

  // Enable bulk for vendor products
  const updateRes = await Product.updateMany(
    { vendor_id: vendor._id },
    {
      $set: {
        is_bulk_available: true,
        bulk_min_qty: 5,
        bulk_unit: 'kg',
        bulk_base_price: 60,
        bulk_stock: 150,
        stock: 150,
        stock_status: 1
      }
    }
  );
  console.log('Updated products with bulk settings:', updateRes.modifiedCount);

  // Find a buyer
  let buyer = await User.findOne({ email: 'user@vegking.com' }).lean();
  if (!buyer) {
    buyer = await User.findOne({}).lean();
  }

  // Find Orange or Kiwi product
  let product = await Product.findOne({ vendor_id: vendor._id, product_name: /Orange/i }).lean();
  if (!product) {
    product = await Product.findOne({ vendor_id: vendor._id }).lean();
  }

  if (!product) {
    console.error('No product found for vendor');
    await mongoose.disconnect();
    return;
  }
  console.log('Selected product:', product.product_name, product._id);

  // Check existing session or create fresh one
  let session = await NegotiationSession.findOne({
    vendor_id: vendor._id,
    product_id: product._id,
    status: 'OPEN'
  });

  if (!session) {
    session = await NegotiationSession.create({
      product_id: product._id,
      vendor_id: vendor._id,
      user_id: buyer ? buyer._id : new mongoose.Types.ObjectId(),
      product_name: product.product_name || product.name,
      product_image: product.product_image || '/images/product-card-default.jpg',
      vendor_shop_name: vendor.shop_name || 'Harvest Hub 2',
      customer_name: buyer?.name || buyer?.full_name || 'Amit Patel (Fresh Mart Retail)',
      customer_mobile: buyer?.mobile_no || buyer?.phone || '9876543210',
      requested_qty: 25,
      unit: 'kg',
      original_price: Number(product.selling_price) || 75,
      initial_offer_price: 60,
      current_counter_price: 60,
      status: 'OPEN',
      last_sender_role: 'user',
      deal_token: 'BULK-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    });
    console.log('Created fresh session:', session._id);

    await NegotiationMessage.create({
      session_id: session._id,
      sender_id: session.user_id,
      sender_role: 'user',
      sender_name: session.customer_name,
      message: `Namaste ${vendor.shop_name}! We require 25 kg of fresh ${product.product_name} weekly for our organic grocery store. Can you supply at ₹60/kg?`,
      proposed_price: 60,
      proposed_qty: 25,
      offer_type: 'PROPOSAL'
    });
  } else {
    console.log('Existing session found:', session._id);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

main().catch(console.error);
