import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import { emitOrderStatusChanged } from '@/lib/socketClient';

// GET /api/orders/[id] — with populated items
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const order = await Order.findById(id).lean();
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    // Fetch order items separately
    const items = await OrderItem.find({ order_id: id }).lean();
    return NextResponse.json({ success: true, data: { ...order, populatedItems: items } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await request.json();
    
    // Fetch the order first to properly track history
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    // Track status history if orderStatus is being updated
    if (body.orderStatus && body.orderStatus !== order.orderStatus) {
      order.statusHistory.push({
        status: body.orderStatus,
        updatedAt: new Date(),
        // Note: You can pass updatedBy (DeliveryBoy ID or Admin User ID) inside the body 
        // to track specifically WHO changed it.
        updatedBy: body.updatedBy || null, 
      });
    }

    // Apply other updates
    Object.assign(order, body);
    await order.save();

    // Emit real-time event to socket server
    if (body.orderStatus) {
      emitOrderStatusChanged({
        order_id: order._id,
        order_number: order.order_number,
        orderStatus: order.orderStatus,
        status: order.status,
        updatedBy: body.updatedBy || 'admin',
      });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    await Order.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
