import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Cart from '@/lib/models/Cart';
import Wishlist from '@/lib/models/Wishlist';
import { getUserIdFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: `Invalid product ID format: "${id}". Please provide a valid 24-character hex ID.`
      }, { status: 400 });
    }

    const product: any = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    // Enrich with per-user data if authenticated
    let is_wishlist = false;
    let cart_count = 0;
    let is_in_cart = false;

    const userId = await getUserIdFromRequest(request);
    if (userId) {
      const [wishlistDoc, cartDoc] = await Promise.all([
        Wishlist.findOne({ user_id: userId, product_id: id }).lean(),
        Cart.findOne({ user_id: userId }).lean() as any,
      ]);

      is_wishlist = !!wishlistDoc;
      if (cartDoc) {
        const cartItem = (cartDoc.items || []).find(
          (i: any) => i.product_id?.toString() === id
        );
        cart_count = cartItem?.qty || 0;
        is_in_cart = cart_count > 0;
      }
    }

    // Compute discount & savings
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
      _id: { $ne: id },
      category: product.category,
      is_active: '1'
    }).limit(10).lean();

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        discount_percent,
        saving_amount,
        is_wishlist,
        is_in_cart,
        cart_count,
        in_stock: (product.stock_status || 0) > 0,
        similar_products: similarProducts
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// ─── UPDATE PRODUCT (PATCH) ───────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const updateData: any = { ...body };

    // Standardize stock and price if aliases sent
    if (body.price !== undefined && body.selling_price === undefined) {
      updateData.selling_price = parseFloat(body.price);
    }
    if (body.stock !== undefined && body.stock_status === undefined) {
      updateData.stock_status = parseInt(body.stock);
    }

    const updated = await Product.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// ─── DELETE PRODUCT (DELETE) ──────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
    }

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

