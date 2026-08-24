import mongoose, { Schema, model, models } from 'mongoose';

const SubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    image: { type: String },
    size: { type: String },
    selectedWeight: { type: String },
    quantity: { type: Number, default: 1 },
    frequency: { type: String, enum: ['weekly', 'monthly'], default: 'weekly' },
    deliveryDate: { type: String, default: 'Monday' },
    price: { type: Number, default: 0 },
    chargedAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'inactive'],
      default: 'active',
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending', 'rejected'],
      default: 'pending',
    },
    nextDeliveryDate: { type: Date },
  },
  { timestamps: true }
);

export default models.Subscription || model('Subscription', SubscriptionSchema);
