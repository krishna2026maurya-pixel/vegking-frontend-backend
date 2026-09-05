import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import Product from '@/lib/models/Product';
import mongoose from 'mongoose';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { message: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { items, totalAmount, shippingAddress, delivery_charge } = body;

    if (!items?.length || totalAmount == null || !shippingAddress) {
      return NextResponse.json(
        { message: 'Missing required order fields.' },
        { status: 400 }
      );
    }

    // Enforce DB product stock limits
    for (const item of items) {
      const rawId = item.productId || item._id;
      if (mongoose.isValidObjectId(rawId)) {
        const prod = await Product.findById(rawId);
        if (prod) {
          const reqQty = Number(item.quantity || 1);
          const isBulk = Boolean(item.is_bulk_deal);
          const availableStock = isBulk
            ? (prod.bulk_stock !== undefined && prod.bulk_stock !== null ? prod.bulk_stock : prod.stock)
            : (prod.stock !== undefined && prod.stock !== null ? prod.stock : 0);

          if (availableStock !== undefined && reqQty > availableStock) {
            return NextResponse.json(
              {
                message: `You cannot order more than the product stock limit (${availableStock} available) for "${prod.product_name || item.name}".`
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Generate order number
    const order_number = `ORD-${Date.now()}`;

    // Persist a pending order in DB first (items added after)
    const order = await Order.create({
      order_number,
      user_id: session?.user ? (session.user as any).id : null,
      total_amount: totalAmount,
      delivery_charge: delivery_charge !== undefined ? Number(delivery_charge) : 0,
      payment_method: 'ONLINE',
      payment_status: 'pending',
      shippingAddress,
    });

    // Create OrderItem documents linked to the order
    const createdItems = await OrderItem.insertMany(
      items.map((item: any) => ({
        order_id: order._id,
        product_id: item.productId,
        product_name: item.name,
        qty: item.quantity,
        price: item.price,
        image: item.image,
      }))
    );

    // Link items back to the order
    order.items = createdItems.map((i: any) => i._id);
    await order.save();

    // Create Razorpay order (amount in paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: order_number,
    });

    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      orderId: order._id.toString().toUpperCase(),
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error: any) {
    console.error('create-payment error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create payment order.' },
      { status: 500 }
    );
  }
}
