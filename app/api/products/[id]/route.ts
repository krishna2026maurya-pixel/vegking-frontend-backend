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
    return NextResponse.json({ success: true, data: item }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
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

    // Ensure stock and stock_status are numeric if provided
    if (body.stock !== undefined && body.stock !== null && body.stock !== '') {
      body.stock = Number(body.stock);
    }
    if (body.stock_status !== undefined && body.stock_status !== null && body.stock_status !== '') {
      body.stock_status = Number(body.stock_status);
    } else if (body.stock !== undefined) {
      body.stock_status = Number(body.stock) > 0 ? 1 : 0;
    }

    // Ensure price numbers are numeric
    if (body.mrp !== undefined && body.mrp !== null && body.mrp !== '') body.mrp = Number(body.mrp) || 0;
    if (body.selling_price !== undefined && body.selling_price !== null && body.selling_price !== '') body.selling_price = Number(body.selling_price) || 0;
    if (body.gst !== undefined && body.gst !== null && body.gst !== '') body.gst = Number(body.gst) || 0;
    if (body.total_amt !== undefined && body.total_amt !== null && body.total_amt !== '') body.total_amt = Number(body.total_amt) || 0;

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

    // If 'images' array is updated, ensure 'product_image' has a valid front image
    if (Array.isArray(body.images) && body.images.length > 0) {
      if (!body.product_image || !body.images.includes(body.product_image)) {
        body.product_image = body.images[0];
      }
      body.product_images = JSON.stringify(body.images);
    }

    const item = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!item) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

    // Trigger real-time notification for Admin and Vendor
    try {
      const { notifyProductUpdated } = await import('@/lib/realtimeNotifications');
      await notifyProductUpdated(item, body.vendor_shop_name || 'Admin / Vendor');
    } catch (notifErr) {
      console.error('Failed to dispatch real-time product update notification:', notifErr);
    }

    return NextResponse.json({ success: true, data: item }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

