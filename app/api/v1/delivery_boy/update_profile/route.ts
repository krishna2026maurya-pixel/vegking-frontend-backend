import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import mongoose from 'mongoose';

/**
 * POST /api/v1/delivery_boy/update_profile
 * Updates rider profile and bank details
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {}

    const { searchParams } = new URL(request.url);
    const riderId = body.delivery_boy_id || body.riderId || body.id || searchParams.get('delivery_boy_id') || searchParams.get('rider_id');

    if (!riderId || !mongoose.Types.ObjectId.isValid(riderId)) {
      return NextResponse.json({ success: false, message: 'Valid delivery_boy_id is required' }, { status: 400 });
    }

    const rider = await DeliveryBoy.findById(riderId);

    if (!rider) {
      return NextResponse.json({ success: false, message: 'Delivery boy profile not found' }, { status: 404 });
    }

    if (body.name) rider.name = body.name;
    if (body.phone || body.mobile_number) rider.mobile_number = body.phone || body.mobile_number;
    if (body.email) rider.email = body.email;
    if (body.gps_address) rider.gps_address = body.gps_address;
    if (body.bank_name) rider.bank_name = body.bank_name;
    if (body.bank_account_number) rider.bank_account_number = body.bank_account_number;
    if (body.bank_ifcs_code) rider.bank_ifcs_code = body.bank_ifcs_code;
    if (body.bank_branch) rider.bank_branch = body.bank_branch;
    if (body.account_holder_name) rider.account_holder_name = body.account_holder_name;

    await rider.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: String(rider._id),
        name: rider.name,
        phone: rider.mobile_number,
        email: rider.email,
        gps_address: rider.gps_address,
        bank_name: rider.bank_name,
        bank_account_number: rider.bank_account_number,
        bank_ifcs_code: rider.bank_ifcs_code,
        bank_branch: rider.bank_branch,
        account_holder_name: rider.account_holder_name
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = POST;
