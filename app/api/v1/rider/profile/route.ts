import { NextRequest, NextResponse } from 'next/server';
import { authenticateRider } from '@/lib/riderAuth';

export async function GET(request: NextRequest) {
  try {
    const rider = await authenticateRider(request);
    if (!rider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      data: {
        _id: rider._id,
        name: rider.name,
        email: rider.email,
        mobile_number: rider.mobile_number,
        vehicle_type: rider.vehicle_type,
        vehicle_number: rider.vehicle_number,
        is_active: rider.is_active,
        is_verified: rider.is_verified,
        wallet_balance: rider.wallet_balance,
        current_lat: rider.current_lat,
        current_long: rider.current_long,
        profile_image: rider.profile_image,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
