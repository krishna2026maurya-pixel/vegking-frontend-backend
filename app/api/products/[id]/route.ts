import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Vendor from '@/lib/models/Vendor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const item = await Product.findById(id)
      .populate('vendor_id', 'shop_name full_name shop_image is_verified city address state gps_location')
      .lean();
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

    // Vendor enrichment
    if (body.vendor_id) {
      const vendor = await Vendor.findById(body.vendor_id).select('shop_name').lean() as any;
      if (vendor) {
        body.vendor_shop_name = vendor.shop_name;
      }
    } else if (body.vendor_id === '' || body.vendor_id === null) {
      body.vendor_id = null;
      body.vendor_shop_name = '';
    }

    // Ensure stock_status is numeric if provided
    if (body.stock_status !== undefined) {
      body.stock_status = Number(body.stock_status) || 0;
    }

    // Bulk fields normalization (min 5 kg enforced)
    if (body.is_bulk_available !== undefined) {
      body.is_bulk_available = Boolean(body.is_bulk_available);
      if (body.is_bulk_available) {
        body.bulk_min_qty = Math.max(5, Number(body.bulk_min_qty) || 5);
        if (body.bulk_base_price !== undefined) body.bulk_base_price = Number(body.bulk_base_price) || 0;
        if (body.bulk_stock !== undefined) body.bulk_stock = Number(body.bulk_stock) || 0;
        body.bulk_unit = body.bulk_unit || 'kg';
      }
    }

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

