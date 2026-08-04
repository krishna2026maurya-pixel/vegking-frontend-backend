import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';

async function getNotifications(request: NextRequest, userId: string) {
  try {
    // Return sample notifications
    const notifications = [
      {
        id: '1',
        title: 'Welcome to VegiMart!',
        body: 'Enjoy fresh vegetables and fruits delivered to your doorstep.',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Exciting Offers!',
        body: 'Use code FRESH10 to get 10% off on your first order.',
        createdAt: new Date().toISOString()
      }
    ];
    return NextResponse.json({ success: true, data: notifications });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const GET = authMiddleware(getNotifications);
