import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Vendor from '@/lib/models/Vendor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10); // raised default so all products load
    const search = searchParams.get('search') || '';
    const vendor_id = searchParams.get('vendor_id') || '';
    const category = searchParams.get('category') || '';
    const is_bulk = searchParams.get('is_bulk');

    const query: any = {};
    if (search) query.product_name = { $regex: search, $options: 'i' };
    if (is_bulk === 'true' || is_bulk === '1') query.is_bulk_available = true;
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

    const [rawProducts, totalRaw] = await Promise.all([
      Product.find(query)
        .populate('vendor_id', 'shop_name full_name')
        .sort({ createdAt: -1 })
        .limit(vendor_id ? limit : 1000)
        .skip(vendor_id ? (page - 1) * limit : 0)
        .lean(),
      Product.countDocuments(query),
    ]);

    let productsList = rawProducts;
    let total = totalRaw;
    if (!vendor_id) {
      const seen = new Map<string, any>();
      for (const p of rawProducts) {
        const key = `${(p.product_name || '').trim().toLowerCase()}_${(p.brand || '').trim().toLowerCase()}`;
        if (!seen.has(key)) {
          seen.set(key, p);
        } else {
          const existing = seen.get(key);
          const existingPrice = Number(existing.selling_price) || Number(existing.total_amt) || 0;
          const currentPrice = Number(p.selling_price) || Number(p.total_amt) || 0;
          if (currentPrice < existingPrice) {
            seen.set(key, p);
          }
        }
      }
      const groupedList = Array.from(seen.values());
      total = groupedList.length;
      productsList = groupedList.slice((page - 1) * limit, page * limit);
    }

    // Normalize to the shape ProductCard expects
    const products = productsList.map((p: any) => {
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

      const rawStock = Number(p.stock);
      const rawStatus = Number(p.stock_status);
      const stockQty = !isNaN(rawStock) && rawStock > 0 ? rawStock : 10;
      const stockStatus = (!isNaN(rawStatus) && rawStatus === 0 && rawStock === 0) ? 0 : 1;
      const inStock = stockStatus === 1 && stockQty > 0;

      const vendorObj = typeof p.vendor_id === 'object' && p.vendor_id !== null ? p.vendor_id : null;
      const vendorShopName = vendorObj?.shop_name || p.vendor_shop_name || '';
      const vendorId = vendorObj ? vendorObj._id : (p.vendor_id || '');

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
        stock:        stockQty,
        stock_status: stockStatus,
        inStock,
        gst:          Number(p.gst) || 0,
        quantity:     p.quantity || '',
        brand:        p.brand || '',
        vendor_id:    vendorId,
        vendor_shop_name: vendorShopName,
        // Bulk selling fields
        is_bulk_available: Boolean(p.is_bulk_available),
        bulk_min_qty:      Number(p.bulk_min_qty) >= 5 ? Number(p.bulk_min_qty) : 5,
        bulk_base_price:   p.bulk_base_price !== undefined && p.bulk_base_price !== null ? Number(p.bulk_base_price) : null,
        bulk_unit:         p.bulk_unit || 'kg',
        bulk_stock:        p.bulk_stock !== undefined && p.bulk_stock !== null ? Number(p.bulk_stock) : null,
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
    } else if (body.vendor_id === '' || body.vendor_id === null) {
      body.vendor_id = null;
      body.vendor_shop_name = '';
    }

    if (body.stock_status !== undefined) {
      body.stock_status = Number(body.stock_status) || 0;
    }

    // Bulk fields normalization (min 5 kg enforced)
    if (body.is_bulk_available) {
      body.is_bulk_available = Boolean(body.is_bulk_available);
      body.bulk_min_qty = Math.max(5, Number(body.bulk_min_qty) || 5);
      if (body.bulk_base_price !== undefined) body.bulk_base_price = Number(body.bulk_base_price) || 0;
      if (body.bulk_stock !== undefined) body.bulk_stock = Number(body.bulk_stock) || 0;
      body.bulk_unit = body.bulk_unit || 'kg';
    } else {
      body.is_bulk_available = false;
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
