import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wishlist from '@/lib/models/Wishlist';
import Product from '@/lib/models/Product';
import { authMiddleware } from '@/lib/auth';

async function addToWishlist(request: NextRequest, userId: string) {
  try {
    await connectDB();
    const body = await request.json();
    const { product_id } = body;
    
    if (!product_id) {
      return NextResponse.json({ success: false, error: 'Product ID is required.' }, { status: 400 });
    }
    
    const product = await Product.findById(product_id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }
    
    // Create or find existing
    const existing = await Wishlist.findOne({ user_id: userId, product_id });
    if (existing) {
      return NextResponse.json({ success: true, message: 'Product already in wishlist.', data: existing });
    }
    
    const item = await Wishlist.create({ user_id: userId, product_id });
    return NextResponse.json({ success: true, message: 'Added to wishlist successfully.', data: item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const POST = authMiddleware(addToWishlist);
