import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Cart from '@/lib/models/Cart';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || (session?.user as any)?._id || await getUserIdFromRequest(request);
    if (userId) {
      await Cart.findOneAndUpdate({ user_id: userId }, { items: [] });
    }
    return NextResponse.json({ success: true, message: 'Cart cleared successfully.' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  return POST(request);
}

export async function GET(request: NextRequest) {
  return POST(request);
}
