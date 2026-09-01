import mongoose, { Schema, model, models } from 'mongoose';

const notificationTypes = [
  'approved', 'rejected', 'cancelled', 'paused', 'resumed',
  'recurring_created', 'delivery_reminder', 'renewal_reminder',
  'new_subscription', 'recurring_failed', 'pending_approval',
  'user_registered', 'user_login', 'vendor_login', 'product_created', 'product_updated',
  'product_deleted', 'low_stock', 'wholesale_inquiry', 'recurring_processed',
  'new_order', 'vendor_application', 'order_status',
  'bulk_inquiry', 'bulk_chat', 'negotiation'
];

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  vendor_id: { type: Schema.Types.ObjectId, ref: 'Vendor', default: null },
  session_id: { type: Schema.Types.ObjectId, ref: 'NegotiationSession', default: null },
  isAdmin: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: notificationTypes
  },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

if (models && (models as any).Notification) {
  delete (models as any).Notification;
}

export default models.Notification || model('Notification', NotificationSchema);
