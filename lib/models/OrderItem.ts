import mongoose, { Schema, model, models } from 'mongoose';

const OrderItemSchema = new Schema({
  order_id:     { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  product_id:   { type: Schema.Types.ObjectId, ref: 'Product', required: false, default: null },
  product_name: { type: String, required: true },
  qty:          { type: Number, required: true },
  price:        { type: Number, required: true },
  image:        { type: String, default: '' },
  is_bulk_deal: { type: Boolean, default: false },
  negotiation_id: { type: Schema.Types.ObjectId, ref: 'NegotiationSession' },
  unit:         { type: String, default: 'kg' },
  delivery_boy_id: { type: Schema.Types.ObjectId, ref: 'DeliveryBoy', default: null },
  item_status:  { type: String, default: 'Pending' },
}, { timestamps: true });

// Delete cached model so schema changes are picked up on hot-reload
delete (mongoose.models as any)['OrderItem'];

export default model('OrderItem', OrderItemSchema);
