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
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { order_number: id }] }
      : { order_number: id };

    const order = await Order.findOne(query);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const orderId = order._id;
    const orderNumber = order.order_number;

    await Order.deleteOne({ _id: orderId });
    await OrderItem.deleteMany({
      $or: [
        { order_id: orderId },
        { order_id: orderId.toString() },
        ...(order.items && order.items.length > 0 ? [{ _id: { $in: order.items } }] : [])
      ]
    });

    try {
      const Notification = (await import('@/lib/models/Notification')).default;
      await Notification.deleteMany({
        $or: [
          { link: { $regex: orderId.toString(), $options: 'i' } },
          { message: { $regex: orderNumber, $options: 'i' } },
          { title: { $regex: orderNumber, $options: 'i' } }
        ]
      });
    } catch (_) {}

    try {
      const { emitOrderDeleted } = await import('@/lib/socketClient');
      emitOrderDeleted({ order_id: orderId.toString(), order_number: orderNumber });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: `Order #${orderNumber} deleted successfully from database and user orders.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
