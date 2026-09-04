import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import Order from '@/lib/models/Order';
import mongoose from 'mongoose';

/**
 * GET/POST /api/v1/delivery_boy/wallet_transcation_history
 * Returns rider wallet balance and earnings history
 */
async function handleWalletHistory(request: NextRequest) {
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

    const rider = await DeliveryBoy.findById(riderId).lean();
    if (!rider) {
      return NextResponse.json({ success: false, message: 'Delivery boy profile not found' }, { status: 404 });
    }

    const query: any = {
      delivery_boy_id: rider._id,
      orderStatus: { $in: ['Delivered', 'Completed', '4'] }
    };

    const deliveredOrders = await Order.find(query).sort({ updatedAt: -1 }).limit(50).lean();

    let totalEarnings = Number(rider.wallet_balance || 0);

    const transactionHistory = deliveredOrders.map((ord: any, index: number) => {
      const earn = Number(ord.delivery_charge || 50);
      return {
        id: index + 1001,
        delivery_boy_id: String(rider._id),
        amt: String(earn.toFixed(2)),
        operation_type: 'credit',
        remark: `Delivery Earning for Order #${ord.order_number || ord._id}`,
        status: 'success',
        added_date_time: ord.updatedAt ? new Date(ord.updatedAt).toISOString() : new Date().toISOString(),
        created_at: ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Wallet transaction history fetched successfully',
      response: {
        wallet_balance: String(totalEarnings.toFixed(2)),
        transaction_history: transactionHistory
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = handleWalletHistory;
export const POST = handleWalletHistory;
