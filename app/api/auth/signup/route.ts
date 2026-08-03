import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, mobile_no } = body;

    if (!name || !email || !password || !mobile_no) {
      return NextResponse.json(
        { error: 'Name, email, password, and mobile number are required.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { mobile_no }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or mobile number already exists.' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      mobile_no,
      is_active: '1',
      wallet_balance: 0,
    });

    return NextResponse.json(
      { success: true, message: 'User registered successfully.' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong during signup.' },
      { status: 500 }
    );
  }
}
