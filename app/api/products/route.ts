import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Vendor from '@/lib/models/Vendor';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const vendor_id = searchParams.get('vendor_id') || '';

    const query: any = {};
    if (search) query.product_name = { $regex: search, $options: 'i' };
<<<<<<< HEAD
    if (vendor_id) query.vendor_id = vendor_id;
=======
    if (vendor_id) {
      if (mongoose.Types.ObjectId.isValid(vendor_id)) {
        query.$or = [
          { vendor_id: vendor_id },
          { vendor_id: new mongoose.Types.ObjectId(vendor_id) },
        ];
      } else {
        query.vendor_id = vendor_id;
      }
    }
    if (category && category !== 'All') query.category = { $regex: category, $options: 'i' };
>>>>>>> 03f5774 (product status verified)

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: products, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Enrich vendor data if vendor_id is provided
    if (body.vendor_id) {
      const vendor = await Vendor.findById(body.vendor_id).select('shop_name').lean() as any;
      if (vendor && !body.vendor_shop_name) {
        body.vendor_shop_name = vendor.shop_name;
      }
    }

    // Multi-image logic:
    if (Array.isArray(body.images) && body.images.length > 0) {
      body.product_image = body.images[0];
      // Keep product_images string in sync if it exists in schema
      body.product_images = JSON.stringify(body.images);
    }

    const product = await Product.create(body);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
