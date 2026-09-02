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

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID format.' }, { status: 400 });
    }
    
    const order = await Order.findOne({ _id: id, user_id: userId }).populate('items');
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: order });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const GET = authMiddleware(getOrderDetail);
export const POST = authMiddleware(getOrderDetail); // Allow POST as fallback

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    await OrderItem.deleteMany({ order_id: id });

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

