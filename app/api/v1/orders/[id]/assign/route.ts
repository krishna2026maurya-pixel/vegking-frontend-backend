import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import OrderItem from '@/lib/models/OrderItem';
import mongoose from 'mongoose';

const _ensureModels = [Order, DeliveryBoy, OrderItem];

/**
 * POST /api/v1/orders/{orderId}/assign
 * Assigns a delivery rider/boy to an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const riderId = body.delivery_boy_id || body.riderId || body.rider_id;

    if (!riderId) {
      return NextResponse.json({ success: false, error: 'delivery_boy_id is required' }, { status: 400 });
    }

    let rider = null;
    if (mongoose.Types.ObjectId.isValid(riderId)) {
      rider = await DeliveryBoy.findById(riderId);
    }
    if (!rider) {
      const orConditions: any[] = [{ mobile_number: String(riderId) }, { email: String(riderId) }];
      if (mongoose.Types.ObjectId.isValid(riderId)) {
        orConditions.push({ _id: riderId });
      }
      rider = await DeliveryBoy.findOne({ $or: orConditions });
    }

    if (!rider) {
      return NextResponse.json({ success: false, error: 'Delivery boy not found' }, { status: 404 });
    }

    // Resolve target order by ObjectId OR order_number OR order_id
    let targetOrder = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      targetOrder = await Order.findById(id);
    }
    if (!targetOrder) {
      const orderOrConditions: any[] = [
        { order_number: String(id) },
        { order_id: String(id) },
        { id: String(id) }
      ];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orderOrConditions.push({ _id: id });
      }
      targetOrder = await Order.findOne({ $or: orderOrConditions });
    }

    if (!targetOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Update order status & assign rider using valid enum status
    targetOrder.delivery_boy_id = rider._id;
    targetOrder.orderStatus = 'Packing';
    targetOrder.status = 2; // Packing
    targetOrder.updatedAt = new Date();

    if (!Array.isArray(targetOrder.statusHistory)) {
      targetOrder.statusHistory = [];
    }
    targetOrder.statusHistory.push({
      status: 'Packing',
      updatedAt: new Date()
    });

    await targetOrder.save();

    const updatedOrder = await Order.findById(targetOrder._id)
      .populate('delivery_boy_id', 'name mobile_number is_active vehicle_number vehicle_type')
      .populate('items')
      .lean();

    return NextResponse.json({
      success: true,
      message: `Order assigned to rider ${rider.name} successfully`,
      data: updatedOrder
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
