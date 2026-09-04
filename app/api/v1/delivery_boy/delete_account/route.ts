import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import mongoose from 'mongoose';

/**
 * POST /api/v1/delivery_boy/delete_account
 * Deactivates or removes rider account
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {}

    const { searchParams } = new URL(request.url);
    const riderId = body.delivery_boy_id || body.riderId || body.id || searchParams.get('delivery_boy_id');

    if (riderId && mongoose.Types.ObjectId.isValid(riderId)) {
      await DeliveryBoy.findByIdAndUpdate(riderId, { is_active: '0', is_verified: '0' });
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = POST;
