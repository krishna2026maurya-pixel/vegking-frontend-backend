import mongoose, { Schema, model, models } from 'mongoose';

const OrderItemSchema = new Schema({
  order_id:     { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  product_id:   { type: Schema.Types.ObjectId, ref: 'Product', required: false, default: null },
  product_name: { type: String, required: true },
  qty:          { type: Number, required: true },
  price:        { type: Number, required: true },
  image:        { type: String, default: '' },
}, { timestamps: true });

// Delete cached model so schema changes are picked up on hot-reload
delete (mongoose.models as any)['OrderItem'];

export default model('OrderItem', OrderItemSchema);
