import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { authMiddleware } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * GET /api/v1/orders/:id/track
 * Returns full tracking info for an order belonging to the authenticated customer.
 */
async function trackOrder(request: NextRequest, userId: string, params: any) {
  try {
    await connectDB();
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID.' },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ _id: id, user_id: userId })
      .populate('items')
      .populate('address_id')
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id:                order._id,
        order_number:       order.order_number,
        orderStatus:        order.orderStatus ?? 'Order Placed',
        statusHistory:      order.statusHistory ?? [],
        estimated_delivery: order.estimated_delivery ?? null,
        payment_method:     order.payment_method,
        payment_status:     order.payment_status,
        total_amount:       order.total_amount,
        delivery_charge:    order.delivery_charge,
        address:            order.address_id ?? null,
        items:              order.items ?? [],
        createdAt:          order.createdAt,
        updatedAt:          order.updatedAt,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

export const GET  = authMiddleware(trackOrder);
export const POST = authMiddleware(trackOrder);