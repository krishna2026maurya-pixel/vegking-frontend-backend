import mongoose, { Schema, model, models } from 'mongoose';

const notificationTypes = [
  'approved', 'rejected', 'cancelled', 'paused', 'resumed',
  'recurring_created', 'delivery_reminder', 'renewal_reminder',
  'new_subscription', 'recurring_failed', 'pending_approval',
  'user_registered', 'user_login', 'vendor_login', 'product_created', 'product_updated',
  'product_deleted', 'low_stock', 'wholesale_inquiry', 'recurring_processed',
  'new_order', 'vendor_application', 'order_status'
];

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  isAdmin: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: notificationTypes
  },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

// Dynamically handle enums if they are added
if (mongoose.models.Notification) {
  const typePath = mongoose.models.Notification.schema.path('type');
  notificationTypes.forEach((type) => {
    if (typePath && typePath.enumValues && !typePath.enumValues.includes(type)) {
      typePath.enum(type);
    }
  });
}

export default models.Notification || model('Notification', NotificationSchema);
