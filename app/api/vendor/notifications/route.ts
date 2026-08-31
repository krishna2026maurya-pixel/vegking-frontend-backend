import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import Vendor from '@/lib/models/Vendor';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/vendor/notifications?vendor_id=...
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    let vendorId = searchParams.get('vendor_id');

    // If not provided in query, infer from session
    if (!vendorId && session?.user) {
      const user = session.user as any;
      if (user.vendor_id) {
        vendorId = user.vendor_id;
      } else if (user.role === 'vendor' || user.id) {
        const v = await Vendor.findOne({ $or: [{ user_id: user.id }, { _id: mongoose.isValidObjectId(user.id) ? user.id : null }] });
        if (v) vendorId = v._id.toString();
        else vendorId = user.id;
      }
    }

    const query: any = {};
    if (vendorId && mongoose.isValidObjectId(vendorId)) {
      query.$or = [
        { vendor_id: new mongoose.Types.ObjectId(vendorId) },
        { userId: new mongoose.Types.ObjectId(vendorId) },
      ];
    } else if (vendorId) {
      query.$or = [
        { vendor_id: vendorId },
        { userId: vendorId },
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/vendor/notifications
// Body: { id?: string, mark_all?: boolean, vendor_id?: string }
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, mark_all, vendor_id } = body;

    if (mark_all) {
      const query: any = {};
      if (vendor_id) {
        query.$or = [
          { vendor_id: mongoose.isValidObjectId(vendor_id) ? new mongoose.Types.ObjectId(vendor_id) : vendor_id },
          { userId: mongoose.isValidObjectId(vendor_id) ? new mongoose.Types.ObjectId(vendor_id) : vendor_id },
        ];
      }
      await Notification.updateMany(query, { $set: { isRead: true } });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (id) {
      await Notification.findByIdAndUpdate(id, { $set: { isRead: true } });
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
