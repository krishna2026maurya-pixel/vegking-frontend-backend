import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Vendor from '@/lib/models/Vendor';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10); // raised default so all products load
    const search = searchParams.get('search') || '';
    const vendor_id = searchParams.get('vendor_id') || '';
    const category = searchParams.get('category') || '';

    const query: any = {};
    if (search) query.product_name = { $regex: search, $options: 'i' };
    if (vendor_id) query.vendor_id = vendor_id;
    if (category && category !== 'All') query.category = { $regex: category, $options: 'i' };

    const [rawProducts, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    // Normalize to the shape ProductCard expects
    const products = rawProducts.map((p: any) => {
      // Parse images array — stored as JSON string or array
      let images: string[] = [];
      if (Array.isArray(p.images) && p.images.length > 0) {
        images = p.images;
      } else if (typeof p.product_images === 'string' && p.product_images) {
        try { images = JSON.parse(p.product_images); } catch { images = []; }
      }
      const image = p.product_image || images[0] || '';

      // Discount % derived from mrp vs selling_price
      const mrp = Number(p.mrp) || 0;
      const price = Number(p.selling_price) || Number(p.total_amt) || 0;
      const discount = mrp > 0 && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

      return {
        _id:          p._id,
        name:         p.product_name || '',
        price,
        mrp,
        discount,
        image,
        images,
        category:     p.category || '',
        categorySlug: (p.category || '').toLowerCase().replace(/\s+/g, '-'),
        subcategory:  p.subcategory || '',
        subcategorySlug: (p.subcategory || '').toLowerCase().replace(/\s+/g, '-'),
        description:  p.product_description || p.description || '',
        stock:        p.stock_status === 1 || p.stock_status === '1' ? 99 : 0,
        quantity:     p.quantity || '',
        brand:        p.brand || '',
        vendor_id:    p.vendor_id,
        vendor_shop_name: p.vendor_shop_name || '',
        // keep raw fields too for any admin panels
        product_name: p.product_name,
        selling_price: p.selling_price,
        product_image: p.product_image,
      };
    });

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
