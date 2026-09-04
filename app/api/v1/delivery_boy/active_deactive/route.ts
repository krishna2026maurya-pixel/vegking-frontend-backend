import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import mongoose from 'mongoose';

/**
 * POST /api/v1/delivery_boy/active_deactive
 * Toggles rider online ('1') or offline ('0') status
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
    const statusVal = String(body.status ?? searchParams.get('status') ?? '1');

    if (!riderId || !mongoose.Types.ObjectId.isValid(riderId)) {
      return NextResponse.json({ success: false, message: 'Valid delivery_boy_id is required' }, { status: 400 });
    }

    const rider = await DeliveryBoy.findById(riderId);

    if (!rider) {
      return NextResponse.json({ success: false, message: 'Delivery boy not found' }, { status: 404 });
    }

    rider.is_active = statusVal === '1' ? '1' : '0';
    await rider.save();

    return NextResponse.json({
      success: true,
      message: statusVal === '1' ? 'Status updated to Online' : 'Status updated to Offline',
      data: {
        id: String(rider._id),
        active_status: rider.is_active === '1' ? 'online' : 'offline'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = POST;
