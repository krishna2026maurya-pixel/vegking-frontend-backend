import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminAuthMiddleware } from '@/lib/adminAuth';
import User from '@/lib/models/User';
import Vendor from '@/lib/models/Vendor';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import Notification from '@/lib/models/Notification';
import { sendMulticastNotification } from '@/lib/firebase';

async function broadcastNotification(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { title, message, type = 'broadcast', data = {} } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required.' }, { status: 400 });
    }

    // 1. Fetch all tokens from Users, Vendors, and Delivery Boys
    const [users, vendors, deliveryBoys] = await Promise.all([
      User.find({ fiberbase_token: { $ne: null, $gt: '' } }).select('fiberbase_token').lean(),
      Vendor.find({ fiberbase_token: { $ne: null, $gt: '' } }).select('fiberbase_token').lean(),
      DeliveryBoy.find({ fiberbase_token: { $ne: null, $gt: '' } }).select('fiberbase_token').lean(),
    ]);

    const allTokens = new Set<string>();
    
    users.forEach((u: any) => { if (u.fiberbase_token) allTokens.add(u.fiberbase_token); });
    vendors.forEach((v: any) => { if (v.fiberbase_token) allTokens.add(v.fiberbase_token); });
    deliveryBoys.forEach((d: any) => { if (d.fiberbase_token) allTokens.add(d.fiberbase_token); });

    const tokensList = Array.from(allTokens);

    if (tokensList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No registered device tokens found in the database.',
        sentCount: 0
      });
    }

    // 2. Send multicast push notification
    const result = await sendMulticastNotification(tokensList, title, message, data);

    // 3. Save in-app notification for all users in the DB (so they can see it in their notification inbox)
    const allUsers = await User.find({}).select('_id').lean() as any[];
    if (allUsers.length > 0) {
      const inAppNotifications = allUsers.map(u => ({
        userId: u._id,
        isAdmin: false,
        title,
        message,
        type,
        isRead: false
      }));
      await Notification.insertMany(inAppNotifications);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully broadcasted message to ${tokensList.length} devices.`,
      successCount: result.successCount,
      failureCount: result.failureCount
    });
  } catch (error: any) {
    console.error('Failed to broadcast notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const POST = adminAuthMiddleware(broadcastNotification);
