import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { signToken } from '@/lib/auth';
import { verifyFirebaseIdToken } from '@/lib/firebase';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { mobile_no, otp, name, firebaseToken, fiberbase_token, device, device_type } = body;
    
    if (!mobile_no) {
      return NextResponse.json({ error: 'Mobile number is required.' }, { status: 400 });
    }
    
    if (firebaseToken) {
      // ── Firebase Auth Verification ──────────────────────────────────────────
      const verifiedPhone = await verifyFirebaseIdToken(firebaseToken);
      if (!verifiedPhone) {
        return NextResponse.json({ error: 'Firebase authentication failed or config is missing.' }, { status: 400 });
      }
      
      if (normalizePhone(verifiedPhone) !== normalizePhone(mobile_no)) {
        return NextResponse.json({ error: `Phone number mismatch. Token is for ${verifiedPhone}, but request is for ${mobile_no}.` }, { status: 400 });
      }
    } else {
      // ── Fallback Demo Validation (accept '1234') ────────────────────────────
      if (!otp) {
        return NextResponse.json({ error: 'OTP is required.' }, { status: 400 });
      }
      if (otp !== '1234') {
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
      }
    }
    
    // Check if user exists
    let user = await User.findOne({ mobile_no });
    let isNewUser = false;
    
    if (!user) {
      // NEW USER → Auto Register
      isNewUser = true;
      user = await User.create({
        mobile_no,
        name: name || '',
        email: '',
        is_active: '1',
        wallet_balance: 0,
        fiberbase_token: fiberbase_token || '',
        device: device || '',
        device_type: device_type || ''
      });
    } else {
      let needsSave = false;
      if (fiberbase_token && fiberbase_token !== user.fiberbase_token) {
        user.fiberbase_token = fiberbase_token;
        needsSave = true;
      }
      if (device && device !== user.device) {
        user.device = device;
        needsSave = true;
      }
      if (device_type && device_type !== user.device_type) {
        user.device_type = device_type;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }
    
    // Check if user is active
    if (user.is_active === '0') {
      return NextResponse.json({ error: 'Your account is suspended. Please contact support.' }, { status: 403 });
    }
    
    // Generate JWT token
    const token = signToken({ id: user._id, mobile_no: user.mobile_no });
    
    return NextResponse.json({
      message: isNewUser ? 'Registration successful. Welcome to VegKing!' : 'Login successful. Welcome back!',
      is_new_user: isNewUser,
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile_no: user.mobile_no,
        email: user.email,
        profile_image: user.profile_image || '',
        wallet_balance: user.wallet_balance || 0
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
