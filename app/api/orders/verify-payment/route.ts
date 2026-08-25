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
    await Order.findByIdAndUpdate(orderId, {
      payment_status: 'completed',
      razorpay_order_id,
      razorpay_payment_id,
    });

    return NextResponse.json({ message: 'Payment verified successfully.' });
  } catch (error: any) {
    console.error('verify-payment error:', error);
    return NextResponse.json(
      { message: error.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
