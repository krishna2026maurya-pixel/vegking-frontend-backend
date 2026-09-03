import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import { authMiddleware } from '@/lib/auth';
import mongoose from 'mongoose';

async function getOrderDetail(request: NextRequest, userId: string, params: any) {
  try {
    await connectDB();
    const { id } = params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { order_number: id };

    const order = await Order.findOne(query).populate('items');
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: order });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const GET = authMiddleware(getOrderDetail);
export const POST = authMiddleware(getOrderDetail);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const order = mongoose.Types.ObjectId.isValid(id)
      ? await Order.findById(id)
      : await Order.findOne({ order_number: id });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (body.status !== undefined) {
      order.status = Number(body.status);
      const statusMap: Record<number, string> = {
        0: 'Order Placed',
        1: 'Order Confirmed',
        2: 'Packing',
        3: 'Out for Delivery',
        4: 'Delivered',
        5: 'Cancelled'
      };
      if (statusMap[Number(body.status)]) {
        order.orderStatus = statusMap[Number(body.status)];
      }
    }

    if (body.orderStatus) {
      order.orderStatus = body.orderStatus;
    }

    if (body.delivery_boy_id) {
      order.delivery_boy_id = body.delivery_boy_id;
    }

    await order.save();

    try {
      const { emitOrderStatusChanged } = await import('@/lib/socketClient');
      emitOrderStatusChanged({
        order_id: order._id.toString(),
        order_number: order.order_number,
        status: order.status,
        orderStatus: order.orderStatus
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { order_number: id };

    const order = await Order.findOneAndDelete(query);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    await OrderItem.deleteMany({ order_id: order._id });

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
