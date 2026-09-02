import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import mongoose from 'mongoose';

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const riderId = body.delivery_boy_id || body.riderId || body.rider_id;

    if (!riderId) {
      return NextResponse.json({ success: false, error: 'delivery_boy_id is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(riderId)) {
      return NextResponse.json({ success: false, error: 'Invalid delivery boy ID' }, { status: 400 });
    }

    const rider = await DeliveryBoy.findById(riderId);
    if (!rider) {
      return NextResponse.json({ success: false, error: 'Delivery boy not found' }, { status: 404 });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          delivery_boy_id: rider._id,
          orderStatus: 'Packing',
          updatedAt: new Date()
        },
        $push: {
          statusHistory: {
            status: `Assigned to rider: ${rider.name}`,
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    )
      .populate('delivery_boy_id', 'name mobile is_active vehicle_number')
      .populate('items')
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Order assigned to rider ${rider.name} successfully`,
      data: order
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
