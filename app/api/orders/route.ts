import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { order_number: { $regex: search, $options: 'i' } },
        { customer_mobile: { $regex: search, $options: 'i' } },
      ];
    }
    if (status !== '') {
      query.orderStatus = status;
    }

    // Role-based filtering
    if ((session.user as any).role !== 'admin') {
      query.user_id = (session.user as any).id;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    await connectDB();
    const body = await request.json();
    const { items, totalAmount, shippingAddress } = body;

    if (!items?.length || totalAmount == null || !shippingAddress) {
      return NextResponse.json(
        { message: `Missing required order fields. items=${items?.length || 0}, totalAmount=${totalAmount}, shippingAddress=${!!shippingAddress}` },
        { status: 400 }
      );
    }

    // Generate a unique order number
    const order_number = `ORD-${Date.now()}`;

    // Create the order first
    const order = await Order.create({
      order_number,
      user_id: session?.user ? (session.user as any).id : null,
      total_amount: totalAmount,
      payment_method: 'COD',
      payment_status: 'pending',
      shippingAddress,
    });

    // Create OrderItem documents linked to this order
    const createdItems = await OrderItem.insertMany(
      items.map((item: any) => {
        const rawId = item.productId || item._id;
        return {
          order_id: order._id,
          product_id: mongoose.isValidObjectId(rawId) ? rawId : null,
          product_name: item.name || 'Unknown',
          qty: item.quantity || 1,
          price: item.price || 0,
          image: item.image || '',
        };
      })
    );

    // Link item ids back to the order
    order.items = createdItems.map((i: any) => i._id);
    await order.save();

    return NextResponse.json(
      { _id: order._id.toString(), order_number },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('COD order error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

