import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/lib/models/Vendor';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

const _ensureModels = [Vendor];

/**
 * GET /api/v1/vendor
 * Returns the exact profile & details of the authenticated logged-in vendor
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    let vendorId = searchParams.get('vendor_id') || searchParams.get('id') || user?.vendor_id || user?.id;

    let vendor = null;
    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      vendor = await Vendor.findById(vendorId).lean();
    } else if (vendorId) {
      vendor = await Vendor.findOne({
        $or: [{ email: vendorId }, { mobile_number: vendorId }]
      }).lean();
    }

    if (!vendor && (user as any)?.email) {
      vendor = await Vendor.findOne({ email: (user as any).email }).lean();
    }

    if (!vendor && user?.id) {
      vendor = await Vendor.findOne({
        $or: [{ _id: user.id }, { email: (user as any).email }]
      }).lean();
    }

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: vendor._id,
        _id: vendor._id,
        full_name: vendor.full_name || vendor.shop_name || 'Vendor Owner',
        shop_name: vendor.shop_name || 'Veggie Mart Store',
        email: vendor.email || '',
        mobile_number: vendor.mobile_number || vendor.phone || '',
        city: vendor.city || '',
        state: vendor.state || '',
        address: vendor.address || [vendor.city, vendor.state].filter(Boolean).join(', '),
        wallet_balance: vendor.wallet_balance || 0,
        is_verified: vendor.is_verified || '1'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
