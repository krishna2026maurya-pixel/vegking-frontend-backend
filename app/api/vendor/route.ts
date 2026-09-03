import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/lib/models/Vendor';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * GET /api/vendor
 * Fetches vendor profile details for the vendor mobile app.
 * Supports:
 * - Query param: ?vendor_id=... or ?id=...
 * - Authorization: Bearer <token> or NextAuth Session
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    let vendorId = searchParams.get('vendor_id') || searchParams.get('id');

    const userObj = await getUserFromRequest(request);
    if (!vendorId && userObj) {
      vendorId = userObj.vendor_id || userObj.id;
    }

    let vendor: any = null;
    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      vendor = await Vendor.findById(vendorId).select('-password').lean();
    } else if (vendorId) {
      vendor = await Vendor.findOne({
        $or: [{ email: vendorId }, { mobile_number: vendorId }]
      }).select('-password').lean();
    }

    if (!vendor && userObj?.email) {
      vendor = await Vendor.findOne({ email: userObj.email }).select('-password').lean();
    }

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: vendor,
      vendor: vendor
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
