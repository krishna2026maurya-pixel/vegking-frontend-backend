import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { message: 'Missing payment verification fields.' },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { message: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      );
    }

    // Update order payment status to completed
    await connectDB();
    const existingOrder = await Order.findById(orderId).populate('items');
    if (existingOrder && existingOrder.payment_status !== 'completed') {
      existingOrder.payment_status = 'completed';
      existingOrder.razorpay_order_id = razorpay_order_id;
      existingOrder.razorpay_payment_id = razorpay_payment_id;
      await existingOrder.save();

      // Decrement DB stock for purchased items
      try {
        const { decrementProductStock } = await import('@/lib/inventory');
        const itemsToDeduct = (existingOrder.items || []).map((it: any) => ({
          productId: it.product_id || it.productId || it._id,
          quantity: it.qty || it.quantity || 1,
          is_bulk_deal: Boolean(it.is_bulk_deal),
        }));
        await decrementProductStock(itemsToDeduct);
      } catch (stockErr) {
        console.error('Failed to decrement stock on verify-payment:', stockErr);
      }

      // Trigger real-time notifications and socket emit for paid order
      try {
        const { notifyNewOrder } = await import('@/lib/realtimeNotifications');
        await notifyNewOrder(existingOrder, existingOrder.items);
      } catch (notifErr) {
        console.error('Failed to dispatch notification on verify-payment:', notifErr);
      }
    }

    return NextResponse.json({ message: 'Payment verified successfully.' });
  } catch (error: any) {
    console.error('verify-payment error:', error);
    return NextResponse.json(
      { message: error.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
