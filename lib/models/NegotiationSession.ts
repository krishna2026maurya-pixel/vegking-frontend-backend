import mongoose, { Schema, model, models } from 'mongoose';

const NegotiationSessionSchema = new Schema({
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor_id: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Snapshots for quick display without heavy population
  product_name: { type: String, required: true },
  product_image: { type: String },
  vendor_shop_name: { type: String },
  customer_name: { type: String },
  customer_mobile: { type: String },
  
  // Quantity & Unit constraints (Min 5kg enforced)
  requested_qty: { type: Number, required: true, min: 5 },
  unit: { type: String, default: 'kg' },
  
  // Pricing states
  original_price: { type: Number, required: true }, // Regular retail price per unit
  initial_offer_price: { type: Number, required: true }, // Customer's initial offer per unit
  current_counter_price: { type: Number }, // Latest counter-offer per unit
  final_agreed_price: { type: Number }, // Price per unit upon acceptance
  final_agreed_qty: { type: Number }, // Total quantity agreed upon
  total_deal_amount: { type: Number }, // final_agreed_price * final_agreed_qty
  
  // Session lifecycle
  status: {
    type: String,
    enum: ['OPEN', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    default: 'OPEN'
  },
  last_sender_role: {
    type: String,
    enum: ['user', 'vendor', 'system'],
    default: 'user'
  },
  
  // Checkout & Cart verification token
  deal_token: { type: String },
  deal_expires_at: { type: Date },
  is_added_to_cart: { type: Boolean, default: false },
  is_ordered: { type: Boolean, default: false },
  order_id: { type: Schema.Types.ObjectId, ref: 'Order' },
}, { timestamps: true });

delete (mongoose.models as any)['NegotiationSession'];
export default models.NegotiationSession || model('NegotiationSession', NegotiationSessionSchema);
