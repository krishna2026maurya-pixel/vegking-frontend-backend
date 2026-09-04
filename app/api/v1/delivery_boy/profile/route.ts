import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import mongoose from 'mongoose';

function formatRiderResponse(rider: any) {
  const riderName = rider.name || rider.full_name || rider.rider_name || rider.account_holder_name || (rider.mobile_number ? `Rider (${rider.mobile_number})` : 'Delivery Partner');
  const data = {
    id: String(rider._id),
    name: riderName,
    father_name: rider.father_name || '',
    phone: rider.mobile_number || rider.phone || rider.mobile || '',
    email: rider.email || '',
    gender: rider.gender || 'Male',
    gps_address: rider.gps_address || '',
    gps_lat: rider.current_lat || '25.3176',
    gps_long: rider.current_long || '83.0062',
    district: rider.district || 'Varanasi',
    city: rider.city || 'Varanasi',
    wallet_balance: String(rider.wallet_balance || 0),
    profile_photot: rider.profile_image || '',
    aadhar_front: rider.aadhaar_image || '',
    aadhar_back: rider.aadhaar_back_image || '',
    driving_license: rider.licence_image || '',
    vechile_registration_card: rider.vehicle_number || '',
    bank_name: rider.bank_name || '',
    bank_account_number: rider.bank_account_number || '',
    bank_ifcs_code: rider.bank_ifcs_code || '',
    bank_branch: rider.bank_branch || '',
    account_holder_name: rider.account_holder_name || riderName
  };

  return NextResponse.json({
    success: true,
    message: 'Profile retrieved successfully',
    data
  });
}

/**
 * GET/POST /api/v1/delivery_boy/profile
 * Returns strict rider profile details by rider ID
 */
async function handleProfile(request: NextRequest) {
  try {
    await connectDB();

    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {}

    const { searchParams } = new URL(request.url);
    const riderId = body.delivery_boy_id || body.riderId || body.rider_id || body.id || searchParams.get('delivery_boy_id') || searchParams.get('rider_id');

    if (!riderId || !mongoose.Types.ObjectId.isValid(riderId)) {
      return NextResponse.json({ success: false, message: 'Valid delivery_boy_id is required' }, { status: 400 });
    }

    const rider = await DeliveryBoy.findById(riderId).lean();

    if (!rider) {
      return NextResponse.json({ success: false, message: 'Delivery boy profile not found' }, { status: 404 });
    }

    return formatRiderResponse(rider);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = handleProfile;
export const POST = handleProfile;
