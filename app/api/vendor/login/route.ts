import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/lib/models/Vendor';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "VegKing Vendor REST Login API. Send a POST request with { email, password } to authenticate.",
    endpoint: "/api/vendor/login",
    method: "POST"
  });
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Find vendor case-insensitively
    const vendor = await Vendor.findOne({
      email: { $regex: `^${cleanEmail}$`, $options: 'i' }
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials - vendor not found' },
        { status: 401 }
      );
    }

    // Verify Password
    const isMatch = await bcrypt.compare(cleanPassword, vendor.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials - incorrect password' },
        { status: 401 }
      );
    }

    // Check verification status
    if (vendor.is_verified !== '1') {
      return NextResponse.json(
        { success: false, error: 'Account is pending admin verification' },
        { status: 403 }
      );
    }

    // Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_key';
    const token = jwt.sign(
      {
        id: vendor._id.toString(),
        email: vendor.email,
        shop_name: vendor.shop_name,
        role: 'vendor'
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      vendor: {
        id: vendor._id.toString(),
        full_name: vendor.full_name,
        shop_name: vendor.shop_name,
        email: vendor.email,
        mobile_number: vendor.mobile_number,
        city: vendor.city,
        address: vendor.address,
        is_verified: vendor.is_verified,
        role: 'vendor'
      }
    });
  } catch (error: any) {
    console.error('Vendor API login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
