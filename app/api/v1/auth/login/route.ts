import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Vendor from '@/lib/models/Vendor';
import { hashPassword, signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Handle CORS preflight OPTIONS requests for mobile and web clients
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    
    // Support various field names sent by mobile apps and frontend clients
    const identifier = (body.email || body.username || body.mobile_no || body.mobile_number || body.phone || '').toString().trim();
    const password = body.password ? body.password.toString().trim() : '';

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email (or mobile number) and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = identifier.toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // ── 1. CHECK VENDOR LOGIN (by Email or Mobile Number) ─────────────────────
    const vendor = await Vendor.findOne({
      $or: [
        { email: emailRegex },
        { mobile_number: identifier }
      ]
    });

    if (vendor) {
      // Check verification status (support both string "1" and numeric 1)
      if (vendor.is_verified && String(vendor.is_verified) !== '1') {
        return NextResponse.json(
          { error: 'Your vendor account is pending verification. Please contact admin.' },
          { status: 403 }
        );
      }

      // Check password using bcrypt (with $2y fallback for legacy hashes), sha256, or direct match
      let isMatch = false;
      if (vendor.password) {
        try {
          const normalizedHash = vendor.password.replace(/^\$2y\$/, '$2a$');
          isMatch = await bcrypt.compare(password, normalizedHash);
        } catch {
          isMatch = false;
        }
        if (!isMatch) {
          isMatch = (vendor.password === password) || (vendor.password === hashPassword(password));
        }
      }

      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      const token = signToken({
        id: vendor._id.toString(),
        vendor_id: vendor._id.toString(),
        email: vendor.email,
        role: 'vendor'
      });

      return NextResponse.json({
        success: true,
        message: 'Vendor login successful.',
        token,
        role: 'vendor',
        user: {
          id: vendor._id,
          vendor_id: vendor._id,
          name: vendor.full_name,
          full_name: vendor.full_name,
          shop_name: vendor.shop_name,
          email: vendor.email,
          mobile_no: vendor.mobile_number,
          mobile_number: vendor.mobile_number,
          role: 'vendor',
          is_verified: vendor.is_verified,
          wallet_balance: vendor.wallet_balance || 0
        },
        vendor: {
          id: vendor._id,
          _id: vendor._id,
          full_name: vendor.full_name,
          shop_name: vendor.shop_name,
          email: vendor.email,
          mobile_number: vendor.mobile_number,
          address: vendor.address,
          city: vendor.city,
          is_verified: vendor.is_verified,
          wallet_balance: vendor.wallet_balance || 0
        }
      });
    }

    // ── 2. FALLBACK TO CUSTOMER LOGIN (by Mobile No or Email) ─────────────────
    const user = await User.findOne({
      $or: [
        { mobile_no: identifier },
        { email: emailRegex }
      ]
    });

    if (user) {
      if (user.is_active === '0') {
        return NextResponse.json({ error: 'Your account is suspended. Please contact support.' }, { status: 403 });
      }

      let isCustomerMatch = false;
      if (user.password) {
        try {
          isCustomerMatch = await bcrypt.compare(password, user.password);
        } catch {
          isCustomerMatch = false;
        }
        if (!isCustomerMatch) {
          isCustomerMatch = (user.password === password) || (user.password === hashPassword(password));
        }
      }

      if (!isCustomerMatch) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }

      const token = signToken({ id: user._id.toString(), mobile_no: user.mobile_no, role: 'customer' });

      return NextResponse.json({
        success: true,
        message: 'Login successful.',
        token,
        role: 'customer',
        user: {
          id: user._id,
          name: user.name,
          mobile_no: user.mobile_no,
          email: user.email,
          wallet_balance: user.wallet_balance || 0
        }
      });
    }

    return NextResponse.json({ error: 'No account found with these credentials.' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
