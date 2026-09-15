import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const rawCode = body.code || body.coupon_code || '';
    const code = String(rawCode).trim().toUpperCase();
    const order_total = Number(body.order_total ?? body.cart_total ?? 0);
    
    if (!code || order_total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid coupon code and order total are required.' },
        { status: 400 }
      );
    }
    
    // Case-insensitive lookup for active coupon
    const coupon = await Coupon.findOne({
      code: { $regex: new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      is_active: '1'
    });

    const from_vendor_page = Boolean(body.from_vendor_page);
    const order_vendor_id = body.vendor_id ? String(body.vendor_id) : null;

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive coupon code.' },
        { status: 404 }
      );
    }

    // ── Vendor vs Global Scoping Rules ─────────────────────────────────────
    if (from_vendor_page && order_vendor_id) {
      // User is ordering from a vendor's store
      if (!coupon.vendor_id) {
        return NextResponse.json(
          {
            success: false,
            error: 'This is a global coupon and cannot be used on vendor store orders. Please use this vendor\'s store coupon.',
          },
          { status: 400 }
        );
      }
      if (String(coupon.vendor_id) !== order_vendor_id) {
        return NextResponse.json(
          {
            success: false,
            error: 'This coupon belongs to another vendor and is not valid for this shop.',
          },
          { status: 400 }
        );
      }
    } else {
      // User is ordering from All Products section
      if (coupon.vendor_id) {
        return NextResponse.json(
          {
            success: false,
            error: 'This coupon is a vendor-specific code and is only valid when ordering directly from that vendor\'s store page.',
          },
          { status: 400 }
        );
      }
    }

    // Check expiry
    if (coupon.expires_at) {
      const expiryDate = new Date(coupon.expires_at);
      if (!isNaN(expiryDate.getTime()) && expiryDate.getTime() < Date.now()) {
        return NextResponse.json(
          { success: false, error: 'This coupon has expired.' },
          { status: 400 }
        );
      }
    }

    // Check max usage
    if (coupon.max_uses && typeof coupon.used_count === 'number' && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json(
        { success: false, error: 'This coupon has reached its maximum usage limit.' },
        { status: 400 }
      );
    }
    
    // Check min order amount requirement
    if (coupon.min_order && Number(order_total) < coupon.min_order) {
      const remaining = (coupon.min_order - Number(order_total)).toFixed(2);
      return NextResponse.json(
        { 
          success: false, 
          error: `Minimum order amount of ₹${coupon.min_order} required for this coupon. Add ₹${remaining} more to apply.` 
        },
        { status: 400 }
      );
    }
    
    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percent') {
      discount = parseFloat(((Number(order_total) * coupon.discount_value) / 100).toFixed(2));
    } else {
      discount = Math.min(Number(coupon.discount_value || 0), Number(order_total));
    }
    
    return NextResponse.json({
      success: true,
      message: 'Coupon applied successfully!',
      coupon: {
        code: coupon.code,
        vendor_id: coupon.vendor_id || null,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discount,
        min_order: coupon.min_order || 0,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

