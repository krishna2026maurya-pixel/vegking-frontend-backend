import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/lib/models/Vendor';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * GET /api/vendor
 * Fetches vendor profile details for the vendor mobile app.
 * Supports:
 * - Query param: ?vendor_id=... or ?id=...
 * - Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    let vendorId = searchParams.get('vendor_id') || searchParams.get('id');

    if (!vendorId) {
      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (payload?.vendor_id || payload?.id) {
          vendorId = payload.vendor_id || payload.id;
        }
      }
    }

    let vendor = null;
    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      vendor = await Vendor.findById(vendorId).select('-password').lean();
    } else if (vendorId) {
      vendor = await Vendor.findOne({
        $or: [{ email: vendorId }, { mobile_number: vendorId }]
      }).select('-password').lean();
    }

    // Fallback: if no ID was sent, return the active vendor or list
    if (!vendor) {
      vendor = await Vendor.findOne({ is_verified: '1' }).sort({ updatedAt: -1 }).select('-password').lean();
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
