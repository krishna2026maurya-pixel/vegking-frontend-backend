import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Address from '@/lib/models/Address';
import { authMiddleware } from '@/lib/auth';

async function getAddresses(request: NextRequest, userId: string) {
  try {
    await connectDB();
    const addresses = await Address.find({ user_id: userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: addresses });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

async function addAddress(request: NextRequest, userId: string) {
  try {
    await connectDB();
    const body = await request.json();
    const { label, name, mobile, address_line, city, state, pincode, is_default } = body;
    
    if (!name || !mobile || !address_line || !city || !state || !pincode) {
      return NextResponse.json({ success: false, error: 'All address fields are required.' }, { status: 400 });
    }
    
    // If setting default, unset others first
    if (is_default === true || is_default === '1') {
      await Address.updateMany({ user_id: userId }, { $set: { is_default: false } });
    }
    
    const address = await Address.create({
      user_id: userId,
      label: label || 'Home',
      name,
      mobile,
      address_line,
      city,
      state,
      pincode,
      is_default: is_default === true || is_default === '1'
    });
    
    return NextResponse.json({ success: true, message: 'Address added successfully.', data: address }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const GET = authMiddleware(getAddresses);
export const POST = authMiddleware(addAddress);
