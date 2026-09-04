import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import mongoose from 'mongoose';

const _ensureModels = [Order, DeliveryBoy];

/**
 * POST /api/v1/delivery_boy/update_status
 * Updates order delivery status when accepted or delivered by rider
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const orderId = body.order_id || body.orderID || body.id;
    const statusVal = String(body.status || body.booking_status || '');
    const otpVal = body.otp || body.delivery_otp;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 });
    }

    let targetOrder = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      targetOrder = await Order.findById(orderId);
    }
    if (!targetOrder) {
      targetOrder = await Order.findOne({
        $or: [
          { order_number: orderId },
          { order_id: orderId },
          { id: orderId }
        ]
      });
    }

    if (!targetOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Map numeric / text status to Order schema
    let newOrderStatus = targetOrder.orderStatus;
    let numericStatus = targetOrder.status;

    const riderId = body.delivery_boy_id || body.rider_id || body.riderId;
    if (riderId && mongoose.Types.ObjectId.isValid(riderId)) {
      targetOrder.delivery_boy_id = riderId;
    }

    if (statusVal === '2' || statusVal.toLowerCase().includes('accept') || statusVal.toLowerCase().includes('confirm')) {
      newOrderStatus = 'Packing';
      numericStatus = 2;
    } else if (statusVal === '3' || statusVal.toLowerCase().includes('out')) {
      newOrderStatus = 'Out for Delivery';
      numericStatus = 3;
    } else if (statusVal === '4' || statusVal.toLowerCase().includes('deliver')) {
      newOrderStatus = 'Delivered';
      numericStatus = 4;
      targetOrder.payment_status = 'completed';

      // Increment rider wallet balance by delivery charge or ₹50
      if (riderId && mongoose.Types.ObjectId.isValid(riderId)) {
        await DeliveryBoy.findByIdAndUpdate(riderId, {
          $inc: { wallet_balance: targetOrder.delivery_charge || 50 }
        });
      }
    }

    targetOrder.orderStatus = newOrderStatus;
    targetOrder.status = numericStatus;
    targetOrder.updatedAt = new Date();

    if (!Array.isArray(targetOrder.statusHistory)) {
      targetOrder.statusHistory = [];
    }
    targetOrder.statusHistory.push({
      status: newOrderStatus,
      updatedAt: new Date()
    });

    await targetOrder.save();

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${newOrderStatus} successfully`,
      data: targetOrder
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = POST;
