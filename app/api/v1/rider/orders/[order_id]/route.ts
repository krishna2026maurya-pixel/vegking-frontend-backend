import { NextRequest, NextResponse } from 'next/server';
import { authenticateRider } from '@/lib/riderAuth';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { emitOrderStatusChanged } from '@/lib/socketClient';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ order_id: string }> }) {
  try {
    const rider = await authenticateRider(request);
    if (!rider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id } = await params;
    await connectDB();
    const body = await request.json();

    // Fetch the order
    const order = await Order.findOne({ _id: order_id, delivery_boy_id: rider._id });
    if (!order) {
      return NextResponse.json({ error: 'Order not found or not assigned to you' }, { status: 404 });
    }

    // Enforce OTP check if marking order as Delivered
    if (body.orderStatus === 'Delivered') {
      if (!body.otp) {
        return NextResponse.json({ error: 'Delivery OTP is required to complete the order.' }, { status: 400 });
      }
      const User = (await import('@/lib/models/User')).default;
      const user = await User.findById(order.user_id);
      const correctOtp = user?.delivery_otp || '1234';
      if (body.otp !== correctOtp) {
        return NextResponse.json({ error: 'Invalid Delivery OTP.' }, { status: 400 });
      }
    }

    // Track status history if orderStatus is being updated
    if (body.orderStatus && body.orderStatus !== order.orderStatus) {
      order.statusHistory.push({
        status: body.orderStatus,
        updatedAt: new Date(),
        updatedBy: rider._id, 
      });
    }

    // Apply other updates
    const updateData = { ...body };
    delete updateData.otp;
    Object.assign(order, updateData);
    await order.save();

    // Emit real-time event to socket server
    if (body.orderStatus) {
      emitOrderStatusChanged({
        order_id: order._id,
        order_number: order.order_number,
        orderStatus: order.orderStatus,
        status: order.status,
        updatedBy: rider._id,
        updatedByName: rider.name
      });
    }

    return NextResponse.json({ data: order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
