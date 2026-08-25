import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { mobile_number, password } = body;

    if (!mobile_number || !password) {
      return NextResponse.json({ error: 'Mobile number and password are required' }, { status: 400 });
    }

    // Find rider by mobile number
    const rider = await DeliveryBoy.findOne({ mobile_number });

    // Validate existence and password (assuming plain text as currently created by Admin)
    if (!rider || rider.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate a secure random token
    const token = crypto.randomUUID();

    // Save token to rider document
    rider.fiberbase_token = token;
    await rider.save();

    return NextResponse.json({
      token,
      rider: {
        _id: rider._id,
        name: rider.name,
        mobile_number: rider.mobile_number,
        is_active: rider.is_active,
        vehicle_type: rider.vehicle_type,
        vehicle_number: rider.vehicle_number,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
