import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Cart from '@/lib/models/Cart';
import Product from '@/lib/models/Product';
import { authMiddleware } from '@/lib/auth';

/**
 * POST /api/v1/cart/toggle
 *
 * Body: 
 * - { product_id: string, status: "add" | "remove" | "delete" | "remove_all" | "set_qty", qty?: number }
 *
 * "add"        → +1 every time called
 * "remove"     → -1 every time called (auto-removes when reaches 0)
 * "delete"     → instantly and permanently removes the item from the cart
 * "remove_all" → clears all items from the cart
 * "set_qty"    → directly sets the item quantity to `qty`
 */
async function handleCart(request: NextRequest, userId: string) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const { product_id, status, qty } = body;

    const validStatuses = ['add', 'remove', 'delete', 'remove_all', 'set_qty'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status provided.' }, { status: 400 });
    }

    // Load or create cart
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      cart = new Cart({ user_id: userId, items: [] });
    }

    if (status === 'remove_all' || product_id === 'ALL') {
      cart.items = [];
      await cart.save();
      return NextResponse.json({
        success: true,
        data: {
          updated_product: { product_id: 'ALL', cart_count: 0, is_in_cart: false },
          cart_summary: { cart_count: 0, total_items_qty: 0, total_cart_amount: 0 },
        },
      });
    }

    if (!product_id) {
      return NextResponse.json({ success: false, error: 'product_id is required.' }, { status: 400 });
    }

    const idx: number = cart.items.findIndex(
      (item: any) => item.product_id?.toString() === product_id?.toString()
    );

    let new_cart_count = 0;

    if (status === 'delete') {
      if (idx !== -1) {
        cart.items.splice(idx, 1);
      }
      new_cart_count = 0;
    } else if (status === 'set_qty') {
      const targetQty = Number(qty);
      if (targetQty <= 0) {
        if (idx !== -1) {
          cart.items.splice(idx, 1);
        }
        new_cart_count = 0;
      } else {
        const product: any = await Product.findById(product_id).select('selling_price mrp is_active price stock bulk_stock').lean();
        if (!product) {
          return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
        }
        const maxStock = typeof product.stock === 'number' ? product.stock : 999999;
        if (targetQty > maxStock) {
          return NextResponse.json({
            success: false,
            error: `You cannot order more than the product stock limit (${maxStock} available).`
          }, { status: 400 });
        }

        const price = product?.selling_price || product?.price || product?.mrp || 0;
        if (idx === -1) {
          cart.items.push({ product_id, qty: targetQty, price });
        } else {
          cart.items[idx].qty = targetQty;
        }
        new_cart_count = targetQty;
      }
    } else if (status === 'add') {
      const product: any = await Product.findById(product_id).select('selling_price mrp is_active price stock bulk_stock').lean();
      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
      }
      const maxStock = typeof product.stock === 'number' ? product.stock : 999999;
      const nextQty = idx === -1 ? 1 : cart.items[idx].qty + 1;
      if (nextQty > maxStock) {
        return NextResponse.json({
          success: false,
          error: `You cannot order more than the product stock limit (${maxStock} available).`
        }, { status: 400 });
      }

      if (idx === -1) {
        const price = product.selling_price || product.price || product.mrp || 0;
        cart.items.push({ product_id, qty: 1, price });
        new_cart_count = 1;
      } else {
        cart.items[idx].qty += 1;
        new_cart_count = cart.items[idx].qty;
      }
    } else {
      // remove single quantity
      if (idx === -1) {
        return NextResponse.json({ success: false, error: 'Product is not in cart.' }, { status: 404 });
      }
      cart.items[idx].qty -= 1;
      if (cart.items[idx].qty <= 0) {
        cart.items.splice(idx, 1);
        new_cart_count = 0;
      } else {
        new_cart_count = cart.items[idx].qty;
      }
    }

    await cart.save();

    // Cart totals
    let total = 0;
    let total_qty = 0;
    cart.items.forEach((item: any) => {
      total += (item.price || 0) * (item.qty || 1);
      total_qty += item.qty || 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        updated_product: {
          product_id,
          cart_count: new_cart_count,
          is_in_cart: new_cart_count > 0,
        },
        cart_summary: {
          cart_count: cart.items.length,
          total_items_qty: total_qty,
          total_cart_amount: parseFloat(total.toFixed(2)),
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const POST = authMiddleware(handleCart);
