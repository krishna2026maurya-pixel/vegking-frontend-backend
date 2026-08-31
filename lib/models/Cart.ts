import mongoose, { Schema, model, models } from 'mongoose';

const CartSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    is_bulk_deal: { type: Boolean, default: false },
    negotiation_id: { type: Schema.Types.ObjectId, ref: 'NegotiationSession' },
    unit: { type: String, default: 'kg' },
  }]
}, { timestamps: true });

delete (mongoose.models as any)['Cart'];
export default models.Cart || model('Cart', CartSchema);
