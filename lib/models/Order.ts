import mongoose, { Schema, model, models } from 'mongoose';

// ── Valid string statuses for the tracking system ─────────────────────────────
export const ORDER_STATUSES = [
  'Order Placed',
  'Order Confirmed',
  'Packing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
] as const;

export type OrderStatusType = typeof ORDER_STATUSES[number];

// Numeric status ↔ string status (backward compat with old numeric field)
export const STATUS_NUM_TO_STR: Record<number, OrderStatusType> = {
  0: 'Order Placed',
  1: 'Order Confirmed',
  2: 'Packing',
  3: 'Out for Delivery',
  4: 'Delivered',
  5: 'Cancelled',
};

export const STATUS_STR_TO_NUM: Record<OrderStatusType, number> = {
  'Order Placed':     0,
  'Order Confirmed':  1,
  'Packing':          2,
  'Out for Delivery': 3,
  'Delivered':        4,
  'Cancelled':        5,
};

// State machine — which transitions are allowed
export const VALID_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
  'Order Placed':     ['Order Confirmed', 'Cancelled'],
  'Order Confirmed':  ['Packing', 'Cancelled'],
  'Packing':          ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  'Delivered':        [],  // terminal
  'Cancelled':        [],  // terminal
};

// ── StatusHistory sub-document ────────────────────────────────────────────────
const StatusHistorySchema = new Schema(
  {
    status:    { type: String, enum: ORDER_STATUSES, required: true },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

// ── Order schema ──────────────────────────────────────────────────────────────
const OrderSchema = new Schema(
  {
    order_number:    { type: String, required: true },
    user_id:         { type: Schema.Types.ObjectId, ref: 'User' },
    address_id:      { type: Schema.Types.ObjectId, ref: 'Address', default: null },
    delivery_boy_id: { type: Schema.Types.ObjectId, ref: 'DeliveryBoy', default: null },
    total_amount:    Number,
    admin_commission:Number,
    delivery_charge: Number,
    payment_method:  { type: String, enum: ['COD', 'ONLINE'], default: 'COD' },
    payment_status:  { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },

    // ── Legacy numeric status (kept for backward compat) ──────────────────
    status: { type: Number, default: 0 },

    // ── New string-based tracking status ──────────────────────────────────
    orderStatus: {
      type:    String,
      enum:    ORDER_STATUSES,
      default: 'Order Placed',
    },

    // ── Audit trail ───────────────────────────────────────────────────────
    statusHistory: {
      type:    [StatusHistorySchema],
      default: [],
    },

    // ── Estimated delivery date (set by admin) ────────────────────────────
    estimated_delivery: { type: Date, default: null },

    items: [{ type: Schema.Types.ObjectId, ref: 'OrderItem' }],
  },
  { timestamps: true }
);

export default models.Order || model('Order', OrderSchema);
