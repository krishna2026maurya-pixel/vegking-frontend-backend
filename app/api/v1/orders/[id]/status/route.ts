import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import OrderItem from '@/lib/models/OrderItem';
import mongoose from 'mongoose';

const _ensureModels = [Order, DeliveryBoy, OrderItem];


/**
 * PATCH /api/v1/orders/{orderId}/status
 * Updates the order status (e.g. Order Placed, Accepted, Packing, Out for Delivery, Delivered, Cancelled)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    let targetOrder = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      targetOrder = await Order.findById(id);
    }
    if (!targetOrder) {
      targetOrder = await Order.findOne({ order_number: id });
    }

    if (!targetOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();
    const status = body.status !== undefined ? body.status : body.orderStatus;

    if (status === undefined || status === null) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    // Map status string & numeric value
    let numericStatus = 0;
    let finalOrderStatus = 'Order Placed';

    if (typeof status === 'number') {
      numericStatus = status;
      if (status === 0) finalOrderStatus = 'Order Placed';
      else if (status === 1) finalOrderStatus = 'Packing';
      else if (status === 2) finalOrderStatus = 'Ready';
      else if (status === 3) finalOrderStatus = 'Out for Delivery';
      else if (status === 4) finalOrderStatus = 'Delivered';
      else if (status === 5) finalOrderStatus = 'Cancelled';
    } else {
      const s = String(status).trim();
      if (s === 'Order Placed' || s === '0') {
        numericStatus = 0;
        finalOrderStatus = 'Order Placed';
      } else if (s === 'Accepted' || s === 'Packing' || s === 'Preparing' || s === '1') {
        numericStatus = 1;
        finalOrderStatus = 'Packing';
      } else if (s === 'Ready' || s === '2') {
        numericStatus = 2;
        finalOrderStatus = 'Ready';
      } else if (s === 'Out for Delivery' || s === '3') {
        numericStatus = 3;
        finalOrderStatus = 'Out for Delivery';
      } else if (s === 'Delivered' || s === 'Completed' || s === '4') {
        numericStatus = 4;
        finalOrderStatus = 'Delivered';
      } else if (s === 'Cancelled' || s === '5') {
        numericStatus = 5;
        finalOrderStatus = 'Cancelled';
      } else {
        finalOrderStatus = s;
        numericStatus = 1;
      }
    }

    targetOrder.orderStatus = finalOrderStatus;
    targetOrder.status = numericStatus;
    if (finalOrderStatus === 'Delivered' || numericStatus === 4) {
      targetOrder.payment_status = 'completed';
    }
    targetOrder.statusHistory.push({
      status: finalOrderStatus,
      updatedAt: new Date()
    });

    await targetOrder.save();

    const populatedOrder = await Order.findById(targetOrder._id)
      .populate('delivery_boy_id', 'name mobile')
      .populate('items')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: populatedOrder
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
