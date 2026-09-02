import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Vendor from '@/lib/models/Vendor';
import { hashPassword, signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { mobile_no, email, password } = body;

    // ── 1. VENDOR LOGIN VIA EMAIL ──────────────────────────────────────────
    if (email && password) {
      const cleanEmail = email.trim().toLowerCase();
      const vendor = await Vendor.findOne({ email: cleanEmail });

      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found with this email.' }, { status: 404 });
      }

      if (vendor.is_verified !== '1') {
        return NextResponse.json(
          { error: 'Your vendor account is pending verification. Please contact admin.' },
          { status: 403 }
        );
      }

      // Check password using bcrypt, with fallback to direct or sha256 match
      let isMatch = false;
      if (vendor.password) {
        try {
          isMatch = await bcrypt.compare(password, vendor.password);
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

    // ── 2. CUSTOMER LOGIN VIA MOBILE ───────────────────────────────────────
    if (!mobile_no || !password) {
      return NextResponse.json({ error: 'Email (or mobile number) and password are required.' }, { status: 400 });
    }

    const user = await User.findOne({ mobile_no });
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please register.' }, { status: 404 });
    }

    if (user.is_active === '0') {
      return NextResponse.json({ error: 'Your account is suspended. Please contact support.' }, { status: 403 });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword && user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = signToken({ id: user._id.toString(), mobile_no: user.mobile_no, role: 'customer' });

    return NextResponse.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile_no: user.mobile_no,
        email: user.email,
        wallet_balance: user.wallet_balance || 0
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
