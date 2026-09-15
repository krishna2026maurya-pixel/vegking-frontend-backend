import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id') || searchParams.get('vendorId');
    const type = searchParams.get('type'); // 'global' | 'vendor'

    const query: any = { is_active: '1' };

    if (vendorId) {
      const mongoose = (await import('mongoose')).default;
      const vendorConditions: any[] = [vendorId];
      if (mongoose.isValidObjectId(vendorId)) {
        vendorConditions.push(new mongoose.Types.ObjectId(vendorId));
      }
      query.vendor_id = { $in: vendorConditions };
    } else if (type === 'global') {
      query.$or = [{ vendor_id: null }, { vendor_id: { $exists: false } }];
    }

    const coupons = await Coupon.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: coupons });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
