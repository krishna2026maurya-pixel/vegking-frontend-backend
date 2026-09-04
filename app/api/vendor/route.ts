import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/lib/models/Vendor';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

function extractVendorId(request: NextRequest): string | null {
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
  return vendorId;
}

/**
 * GET /api/vendor
 * Fetches vendor profile details for the vendor mobile app.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const vendorId = extractVendorId(request);

    let vendor = null;
    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      vendor = await Vendor.findById(vendorId).select('-password').lean();
    } else if (vendorId) {
      vendor = await Vendor.findOne({
        $or: [{ email: vendorId }, { mobile_number: vendorId }]
      }).select('-password').lean();
    }

    // Fallback: if no ID was sent, return the latest verified vendor
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

/**
 * PATCH /api/vendor
 * Updates vendor profile details from the vendor mobile app.
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const vendorId = extractVendorId(request);
    const body = await request.json();

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Vendor ID or Bearer token is required.' }, { status: 400 });
    }

    const filter = mongoose.Types.ObjectId.isValid(vendorId)
      ? { _id: vendorId }
      : { $or: [{ email: vendorId }, { mobile_number: vendorId }] };

    // Prevent password from being overwritten directly via plain patch
    delete body.password;

    const updated = await Vendor.findOneAndUpdate(filter, body, { new: true }).select('-password').lean();
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Vendor not found to update.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated,
      vendor: updated
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
