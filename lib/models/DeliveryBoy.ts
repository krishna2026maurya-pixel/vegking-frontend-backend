import mongoose, { Schema, model, models } from 'mongoose';

const DeliveryBoySchema = new Schema({
  name: String,
  email: String,
  mobile_number: String,
  password: String,
  vehicle_type: String,
  vehicle_number: String,
  licence_image: String,
  profile_image: String,
  is_active: { type: String, default: '0' },
  is_verified: { type: String, default: '0' },
  wallet_balance: { type: Number, default: 0 },
  fiberbase_token: String,
  current_lat: String,
  current_long: String,
  vendor_id: { type: Schema.Types.ObjectId, ref: 'Vendor', default: null },

  // Rider Profile & Bank Details
  father_name: String,
  gender: String,
  gps_address: String,
  district: String,
  city: String,
  bank_name: String,
  bank_account_number: String,
  bank_ifcs_code: String,
  bank_branch: String,
  account_holder_name: String,
  aadhaar_number: String,
  aadhaar_image: String,
  aadhaar_back_image: String,
  pan_number: String,
  pan_image: String,
}, { timestamps: true });

// Delete cached model so schema changes are picked up on hot-reload
delete (mongoose.models as any)['DeliveryBoy'];

export default model('DeliveryBoy', DeliveryBoySchema);

