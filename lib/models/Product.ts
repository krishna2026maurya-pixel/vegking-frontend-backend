import mongoose, { Schema, model, models } from 'mongoose';

const ProductSchema = new Schema({
  product_name: { type: String, required: true },
  vendor_id: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  vendor_shop_name: String,
  cat_type_id: String,
  category: String,
  subcategory: String,
  low_category: String,
  brand: String,
  product_label: String,
  mrp: Number,
  selling_price: Number,
  gst: Number,
  total_amt: Number,
  quantity: String,
  volume: String,
  stock: { type: Number, default: 10 },
  stock_status: Number,
  product_description: String,
  images: [String],
  product_image: String,
  product_images: String,
  is_active: String,
  description: String,
  add_info_title: String,
  add_info_desc: String,
  // Bulk selling fields
  is_bulk_available: { type: Boolean, default: false },
  bulk_min_qty: { type: Number, default: 5 }, // Enforced >= 5 kg
  bulk_base_price: Number, // Starting wholesale price per kg/unit
  bulk_unit: { type: String, default: 'kg' },
  bulk_stock: Number,
}, { timestamps: true });

delete (mongoose.models as any)['Product'];
export default models.Product || model('Product', ProductSchema);
