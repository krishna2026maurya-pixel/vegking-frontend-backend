import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { mobile_no, password } = body;

    if (!mobile_no || !password) {
      return NextResponse.json({ error: 'Mobile number and password are required.' }, { status: 400 });
    }

    const user = await User.findOne({ mobile_no });
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please register.' }, { status: 404 });
    }

    if (user.is_active === '0') {
      return NextResponse.json({ error: 'Your account is suspended. Please contact support.' }, { status: 403 });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = signToken({ id: user._id, mobile_no: user.mobile_no });

    return NextResponse.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile_no: user.mobile_no,
        email: user.email,
        wallet_balance: user.wallet_balance
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
