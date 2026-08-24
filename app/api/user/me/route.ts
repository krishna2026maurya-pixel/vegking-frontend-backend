import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    await connectDB();

    if (role === 'vendor') {
      const Vendor = (await import('@/lib/models/Vendor')).default;
      const vendor = await Vendor.findById(userId).select('-password');
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }
      return NextResponse.json({ user: vendor });
    } else {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    await connectDB();

    if (role === 'vendor') {
      const { full_name, name, mobile_number, mobile_no, email, shop_name, address, city, state, gps_location, landmark } = await req.json();
      const Vendor = (await import('@/lib/models/Vendor')).default;
      const vendor = await Vendor.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            ...(name || full_name ? { full_name: name || full_name } : {}),
            ...(mobile_no || mobile_number ? { mobile_number: mobile_no || mobile_number } : {}),
            ...(email ? { email } : {}),
            ...(shop_name ? { shop_name } : {}),
            ...(address !== undefined && { address }),
            ...(city !== undefined && { city }),
            ...(state !== undefined && { state }),
            ...(landmark !== undefined && { landmark }),
            ...(gps_location !== undefined && { gps_location }),
          } 
        },
        { new: true }
      ).select('-password');
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }
      return NextResponse.json({ user: vendor });
    } else {
      const { name, mobile_no, email } = await req.json();
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { name, mobile_no, email } },
        { new: true }
      ).select('-password');

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ user });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
