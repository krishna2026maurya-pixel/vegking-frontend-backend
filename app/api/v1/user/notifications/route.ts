import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import Notification from '@/lib/models/Notification';

async function getNotifications(request: NextRequest, userId: string) {
  try {
    await connectDB();
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return NextResponse.json({ success: true, data: notifications });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const GET = authMiddleware(getNotifications);
