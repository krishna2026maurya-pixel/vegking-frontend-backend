import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: String,
  email: String,
  mobile_no: { type: String, required: true },
  password: String,
  profile_image: String,
  is_active: { type: String, default: '1' },
  wallet_balance: { type: Number, default: 0 },
  fiberbase_token: String,
  referral_code: String,
  delivery_otp: { type: String, default: () => Math.floor(1000 + Math.random() * 9000).toString() },
  addresses: [{
    label: { type: String, default: 'Home' },
    address_line_1: String,
    address_line_2: String,
    city: String,
    state: String,
    zip_code: String,
    latitude: Number,
    longitude: Number,
    is_default: { type: Boolean, default: false }
  }]
}, { timestamps: true });

export default models.User || model('User', UserSchema);
