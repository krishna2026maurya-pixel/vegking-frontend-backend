import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';
import { authMiddleware } from '@/lib/auth';

async function applyCoupon(request: NextRequest, userId: string) {
  try {
    await connectDB();
    const body = await request.json();
    const { code, order_total } = body;
    
    if (!code || !order_total) {
      return NextResponse.json({ success: false, error: 'Coupon code and order total are required.' }, { status: 400 });
    }
    
    const coupon = await Coupon.findOne({ code, is_active: '1' });
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive coupon code.' }, { status: 404 });
    }
    
    // Check min order amount requirement
    if (coupon.min_order && Number(order_total) < coupon.min_order) {
      return NextResponse.json({ success: false, error: `Minimum order amount of Rs. ${coupon.min_order} required for this coupon.` }, { status: 400 });
    }
    
    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percent') {
      discount = (Number(order_total) * coupon.discount_value) / 100;
    } else {
      discount = coupon.discount_value;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Coupon applied successfully.',
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discount
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const POST = authMiddleware(applyCoupon);
