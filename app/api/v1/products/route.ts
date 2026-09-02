import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Cart from '@/lib/models/Cart';
import Wishlist from '@/lib/models/Wishlist';
import { getUserIdFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';
import Category from '@/lib/models/Category';

/**
 * GET /api/v1/products          → product list (with optional filters)
 * POST /api/v1/products         → product detail
 *
 * POST supports:
 * - JSON: { "id": "..." } or { "product_id": "..." }
 * - FormData: id="..." or product_id="..."
 * Auth: optional — if token sent, is_wishlist & cart_count are per-user
 */

// ─── LIST ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page     = parseInt(searchParams.get('page')  || '1');
    const limit    = parseInt(searchParams.get('limit') || '10');
    const search   = searchParams.get('search')      || '';
    const category = searchParams.get('category')    || '';
    const brand    = searchParams.get('brand')       || '';

    const vendor_id = searchParams.get('vendor_id') || '';
    const category_id = searchParams.get('category_id') || '';

    const query: any = { is_active: { $ne: '0' } };
    if (search)   query.product_name = { $regex: search, $options: 'i' };
    if (category) query.category     = { $regex: category, $options: 'i' };
    if (brand)    query.brand        = { $regex: brand, $options: 'i' };

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

    if (category_id) {
        if (mongoose.Types.ObjectId.isValid(category_id)) {
            const catDoc = await Category.findById(category_id).lean();
            if (catDoc && (catDoc as any).name) {
                query.category = { $regex: (catDoc as any).name, $options: 'i' };
            }
        } else if (category_id.toLowerCase() !== 'all') {
            // Fallback just in case a string name/slug is passed instead of ObjectId
            query.category = { $regex: category_id, $options: 'i' };
        }
    }

    const [data, total] = await Promise.all([
      Product.find(query).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// ─── DETAIL ────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    let productId: string | null = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      if (body.product_name) {
        // ── CREATE PRODUCT (Vendor Mobile App) ──────────────────────────────
        const product = await Product.create({
          product_name: body.product_name,
          category: body.category || body.category_name || 'Vegetables',
          category_id: body.category_id && mongoose.Types.ObjectId.isValid(body.category_id) ? body.category_id : undefined,
          selling_price: parseFloat(body.selling_price || body.price || 0),
          mrp: parseFloat(body.mrp || body.selling_price || 0),
          product_unit: body.product_unit || body.unit || 'kg',
          stock_status: parseInt(body.stock_status || body.stock || 10),
          product_image: body.product_image || (body.images && body.images[0]) || '',
          images: body.images || (body.product_image ? [body.product_image] : []),
          description: body.description || body.product_description || '',
          vendor_id: body.vendor_id && mongoose.Types.ObjectId.isValid(body.vendor_id) ? body.vendor_id : undefined,
          is_active: body.is_active !== undefined ? String(body.is_active) : '1'
        });
        return NextResponse.json({
          success: true,
          message: 'Product created successfully',
          data: product
        }, { status: 201 });
      }
      productId = body.id || body.product_id;
    } else if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        if (formData.get('product_name')) {
          const product = await Product.create({
            product_name: formData.get('product_name') as string,
            category: (formData.get('category') as string) || 'Vegetables',
            selling_price: parseFloat((formData.get('selling_price') || formData.get('price') || '0') as string),
            mrp: parseFloat((formData.get('mrp') || formData.get('selling_price') || '0') as string),
            product_unit: (formData.get('product_unit') || formData.get('unit') || 'kg') as string,
            stock_status: parseInt((formData.get('stock_status') || formData.get('stock') || '10') as string),
            product_image: (formData.get('product_image') as string) || '',
            description: (formData.get('description') as string) || '',
            is_active: '1'
          });
          return NextResponse.json({
            success: true,
            message: 'Product created successfully',
            data: product
          }, { status: 201 });
        }
        productId = (formData.get('id') || formData.get('product_id')) as string | null;
      }
    }

    // Fallback: URL query param ?id=xxx
    if (!productId) {
      const { searchParams } = new URL(request.url);
      productId = searchParams.get('id') || searchParams.get('product_id');
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required (pass "id" or "product_id" in formData or JSON).' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Product ID format.' },
        { status: 400 }
      );
    }

    // Fetch product
    const product: any = await Product.findById(productId).lean();
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }
    if (product.is_active === '0') {
      return NextResponse.json({ success: false, error: 'Product is not available.' }, { status: 404 });
    }

    // Optional auth — enrich with per-user cart & wishlist if token present
    let is_wishlist  = false;
    let cart_count   = 0;
    let is_in_cart   = false;

    const userId = await getUserIdFromRequest(request);
    if (userId) {
      const [wishlistDoc, cartDoc] = await Promise.all([
        Wishlist.findOne({ user_id: userId, product_id: productId }).lean(),
        Cart.findOne({ user_id: userId }).lean() as any,
      ]);

      is_wishlist = !!wishlistDoc;

      if (cartDoc) {
        const cartItem = (cartDoc.items || []).find(
          (i: any) => i.product_id?.toString() === productId
        );
        cart_count = cartItem?.qty || 0;
        is_in_cart = cart_count > 0;
      }
    }

    // Compute discount
    const discount_percent =
      product.mrp && product.selling_price && product.mrp > product.selling_price
        ? parseFloat((((product.mrp - product.selling_price) / product.mrp) * 100).toFixed(1))
        : 0;

    const saving_amount =
      product.mrp && product.selling_price
        ? parseFloat((product.mrp - product.selling_price).toFixed(2))
        : 0;

    // Fetch Similar Products
    const similarProducts = await Product.find({
      _id: { $ne: productId },
      category: product.category,
      is_active: '1'
    }).limit(10).lean();

    return NextResponse.json({
      success: true,
      data: {
        _id:              product._id,
        product_name:     product.product_name,
        product_image:    product.product_image  || null,
        images:           product.images         || [],
        selling_price:    product.selling_price,
        mrp:              product.mrp,
        discount_percent,
        saving_amount,
        gst:              product.gst            || 0,
        quantity:         product.quantity        || '',
        brand:            product.brand           || null,
        category:         product.category        || null,
        stock_status:     product.stock_status,
        in_stock:         (product.stock_status || 0) > 0,
        description:      product.description    || product.product_description || null,
        is_active:        product.is_active,
        is_bestseller:    product.is_bestseller === '1',

        // Per-user fields (null if no token sent)
        is_wishlist,
        is_in_cart,
        cart_count,       // 0 if not in cart
        similar_products: similarProducts
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
