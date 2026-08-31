import mongoose, { Schema, model, models } from 'mongoose';

const NegotiationMessageSchema = new Schema({
  session_id: { type: Schema.Types.ObjectId, ref: 'NegotiationSession', required: true, index: true },
  sender_id: { type: Schema.Types.ObjectId, required: true },
  sender_role: { type: String, enum: ['user', 'vendor', 'system'], required: true },
  sender_name: { type: String },
  message: { type: String },
  
  // Specific proposal/counter payload
  proposed_price: { type: Number },
  proposed_qty: { type: Number },
  offer_type: {
    type: String,
    enum: ['CHAT', 'PROPOSAL', 'COUNTER', 'ACCEPT', 'REJECT', 'SYSTEM_NOTE'],
    default: 'CHAT'
  },
}, { timestamps: true });

delete (mongoose.models as any)['NegotiationMessage'];
export default models.NegotiationMessage || model('NegotiationMessage', NegotiationMessageSchema);
