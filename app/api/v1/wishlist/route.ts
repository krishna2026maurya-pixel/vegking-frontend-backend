import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wishlist from '@/lib/models/Wishlist';
import Product from '@/lib/models/Product';
import { authMiddleware } from '@/lib/auth';

async function getWishlist(request: NextRequest, userId: string) {
  try {
    await connectDB();
    const data = await Wishlist.find({ user_id: userId }).populate('product_id');
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const GET = authMiddleware(getWishlist);
export const POST = authMiddleware(getWishlist); // Allow POST as fallback
