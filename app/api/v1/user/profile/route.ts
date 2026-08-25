import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { authMiddleware } from '@/lib/auth';

async function getProfile(request: NextRequest, userId: string) {
  try {
    await connectDB();
    let user = await User.findById(userId).select('-password');
    
    if (!user) {
      const Vendor = (await import('@/lib/models/Vendor')).default;
      const vendor = await Vendor.findById(userId).select('-password');
      if (vendor) {
        return NextResponse.json({ success: true, data: vendor });
      }
      return NextResponse.json({ success: false, error: 'User/Vendor not found.' }, { status: 404 });
    }

    if (!user.delivery_otp) {
      user.delivery_otp = Math.floor(1000 + Math.random() * 9000).toString();
      await user.save();
    }
    return NextResponse.json({ success: true, data: user });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

async function updateProfile(request: NextRequest, userId: string) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, full_name, email, mobile_no, mobile_number, profile_image, shop_name, fiberbase_token } = body;
    
    let user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          name, 
          email, 
          profile_image,
          ...(fiberbase_token !== undefined && { fiberbase_token })
        } 
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      const Vendor = (await import('@/lib/models/Vendor')).default;
      const { address, city, state, gps_location, landmark } = body;
      const vendor = await Vendor.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            ...(name || full_name ? { full_name: name || full_name } : {}),
            ...(mobile_no || mobile_number ? { mobile_number: mobile_no || mobile_number } : {}),
            ...(email ? { email } : {}),
            ...(profile_image ? { shop_image: profile_image } : {}),
            ...(shop_name ? { shop_name } : {}),
            ...(address !== undefined && { address }),
            ...(city !== undefined && { city }),
            ...(state !== undefined && { state }),
            ...(landmark !== undefined && { landmark }),
            ...(gps_location !== undefined && { gps_location }),
            ...(fiberbase_token !== undefined && { fiberbase_token })
          } 
        },
        { new: true }
      ).select('-password');
      
      if (vendor) {
        return NextResponse.json({ success: true, message: 'Profile updated.', data: vendor });
      }
      return NextResponse.json({ success: false, error: 'User/Vendor not found.' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Profile updated.', data: user });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const GET = authMiddleware(getProfile);
export const PATCH = authMiddleware(updateProfile);
