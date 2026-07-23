import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { mobile_no } = body;
    
    if (!mobile_no) {
      return NextResponse.json({ error: 'Mobile number is required.' }, { status: 400 });
    }
    
    // Check if user exists or not
    const existingUser = await User.findOne({ mobile_no });
    const isNewUser = !existingUser;
    
    // Generate random 4-digit OTP (Demo mode: always 1234)
    // const otp = '1234';
    
    // In production, integrate SMS gateway here (MSG91, Fast2SMS, etc.)
    // await sendSMS(mobile_no, `Your VegiMart OTP is: ${otp}`);
    
    return NextResponse.json({
      message: 'OTP sent successfully.',
      is_new_user: isNewUser,
      // otp: otp  // Remove this in production! Only for testing.
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
