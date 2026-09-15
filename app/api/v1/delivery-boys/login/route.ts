import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import bcrypt from 'bcryptjs';

/**
 * POST /api/v1/delivery-boys/login
 * Real login endpoint for Delivery Boy app (Strict DB Check, No Dummy Data)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {}

    const mobileOrEmail = String(body.mobile_number || body.phone || body.email || body.username || '').trim();
    const inputPassword = String(body.password || '').trim();

    if (!mobileOrEmail) {
      return NextResponse.json({
        success: false,
        message: 'Please enter a valid mobile number or email'
      }, { status: 400 });
    }

    // Strictly find rider in MongoDB by mobile_number, email, or phone
    const rider = await DeliveryBoy.findOne({
      $or: [
        { mobile_number: mobileOrEmail },
        { email: mobileOrEmail },
        { phone: mobileOrEmail }
      ]
    });

    if (!rider) {
      return NextResponse.json({
        success: false,
        message: 'No registered rider found with this mobile number or email'
      }, { status: 404 });
    }

    // Verify password if rider has password set and inputPassword is provided
    if (rider.password && inputPassword) {
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(inputPassword, rider.password);
      } catch {
        isMatch = false;
      }
      if (!isMatch) {
        isMatch = (rider.password === inputPassword);
      }
      if (!isMatch) {
        return NextResponse.json({
          success: false,
          message: 'Invalid password. Please check your credentials.'
        }, { status: 401 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        delivery_boy: {
          id: String(rider._id),
          name: rider.name || 'Delivery Partner',
          mobile: rider.mobile_number || (rider as any).phone || '',
          email: rider.email || '',
          active_status: rider.is_active === '1' ? 'online' : 'offline',
          is_verified: rider.is_verified || '0',
          wallet_balance: String(rider.wallet_balance || 0),
          vehicle_type: rider.vehicle_type || '',
          vehicle_number: rider.vehicle_number || ''
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = POST;
