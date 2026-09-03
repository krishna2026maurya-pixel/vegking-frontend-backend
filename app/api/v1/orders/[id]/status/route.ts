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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const status = body.status || body.orderStatus;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    // Map numeric status if sent
    let numericStatus = 0;
    if (status === 'Order Placed') numericStatus = 0;
    else if (status === 'Accepted' || status === 'Packing') numericStatus = 1;
    else if (status === 'Out for Delivery') numericStatus = 2;
    else if (status === 'Delivered') numericStatus = 3;
    else if (status === 'Cancelled') numericStatus = 4;

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          orderStatus: status,
          status: numericStatus,
          updatedAt: new Date()
        },
        $push: {
          statusHistory: {
            status: status,
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    )
      .populate('delivery_boy_id', 'name mobile')
      .populate('items')
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
