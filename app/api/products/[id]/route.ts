import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
<<<<<<< HEAD
    const item = await Product.findById(id).lean();
=======
    const item = await Product.findById(id)
      .populate('vendor_id', 'shop_name full_name shop_image is_verified city address state gps_location')
      .lean();
>>>>>>> 03f5774 (product status verified)
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // If 'images' array is updated, ensure 'product_image' stays synced with the first image
    if (Array.isArray(body.images) && body.images.length > 0) {
      body.product_image = body.images[0];
      body.product_images = JSON.stringify(body.images);
    }

    const item = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!item) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
