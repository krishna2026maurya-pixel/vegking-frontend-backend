import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { authMiddleware } from '@/lib/auth';

async function getWallet(request: NextRequest, userId: string) {
  try {
    await connectDB();
    const user = await User.findById(userId).select('wallet_balance');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { wallet_balance: user.wallet_balance || 0 } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const GET = authMiddleware(getWallet);
