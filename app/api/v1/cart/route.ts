import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Cart from '@/lib/models/Cart';
import Product from '@/lib/models/Product';
import Address from '@/lib/models/Address';
import Coupon from '@/lib/models/Coupon';
import User from '@/lib/models/User';
import { authMiddleware } from '@/lib/auth';

const DELIVERY_CHARGE = 40;          // ₹40 flat delivery
const FREE_DELIVERY_ABOVE = 499;     // Free delivery above ₹499

/**
 * GET /api/v1/cart
 *
 * Full cart page + checkout-ready response:
 * - Cart products with cart_count, subtotal, savings per item
 * - Pricing breakdown (subtotal, delivery, total saving, payable)
 * - Default delivery address + all saved addresses
 * - Available & applicable coupons
 * - User wallet balance
 * - Payment methods
 */
async function getCart(request: NextRequest, userId: string) {
  try {
    await connectDB();

    const now = new Date();

    const [cartDoc, addresses, coupons, user] = await Promise.all([
      Cart.findOne({ user_id: userId })
        .populate({
          path: 'items.product_id',
          model: Product,
          select: 'product_name product_image selling_price mrp quantity brand category is_active description stock bulk_stock stock_status',
        })
        .lean() as any,

      Address.find({ user_id: userId }).sort({ is_default: -1, createdAt: -1 }).lean(),

      // Active, non-expired coupons
      Coupon.find({
        is_active: '1',
        $or: [
          { expires_at: { $gt: now.toISOString() } },
          { expires_at: null },
          { expires_at: '' },
        ],
      }).lean(),

      User.findById(userId).select('name email mobile_no wallet_balance').lean() as any,
    ]);

    // ─── Coupons Helper ─────────────────────────────────────────────────────
    const getCoupons = (subtotalAmt: number) => {
      const applicable = (coupons as any[])
        .filter(c => subtotalAmt >= (c.min_order || 0))
        .map(c => {
          const discount = c.discount_type === 'percent'
            ? parseFloat(((subtotalAmt * c.discount_value) / 100).toFixed(2))
            : c.discount_value;
          return {
            _id:            c._id,
            code:           c.code,
            discount_type:  c.discount_type,
            discount_value: c.discount_value,
            min_order:      c.min_order || 0,
            you_save:       discount,
            expires_at:     c.expires_at || null,
            applicable:     true,
          };
        });

      const inapplicable = (coupons as any[])
        .filter(c => subtotalAmt < (c.min_order || 0))
        .map(c => ({
          _id:            c._id,
          code:           c.code,
          discount_type:  c.discount_type,
          discount_value: c.discount_value,
          min_order:      c.min_order || 0,
          need_more:      parseFloat(((c.min_order || 0) - subtotalAmt).toFixed(2)),
          applicable:     false,
          expires_at:     c.expires_at || null,
        }));

      return { applicable, inapplicable };
    };

    // ─── Empty cart ─────────────────────────────────────────────────────────
    if (!cartDoc || !cartDoc.items?.length) {
      const couponInfo = getCoupons(0);
      return NextResponse.json({
        success: true,
        data: {
          // Cart
          cart_count: 0,
          total_items_qty: 0,
          products: [],

          // Pricing
          pricing: {
            subtotal: 0,
            total_mrp: 0,
            total_saving: 0,
            delivery_charge: DELIVERY_CHARGE,
            coupon_discount: 0,
            wallet_used: 0,
            payable_amount: 0,
            free_delivery_above: FREE_DELIVERY_ABOVE,
            is_free_delivery: false,
          },

          // Checkout info
          default_address: addresses.find((a: any) => a.is_default) || addresses[0] || null,
          all_addresses:   addresses,
          address_count:   addresses.length,
          applicable:      couponInfo.applicable,
          coupons:         couponInfo,

          user: user ? {
            name: user.name,
            mobile_no: user.mobile_no,
            wallet_balance: user.wallet_balance || 0,
          } : null,
          payment_methods: [
            { id: 'COD',    label: 'Cash on Delivery', icon: 'cash',   is_active: true },
            { id: 'ONLINE', label: 'Pay Online',        icon: 'upi',    is_active: true },
            { id: 'WALLET', label: 'Wallet',             icon: 'wallet', is_active: true,
              balance: user?.wallet_balance || 0 },
          ],
        },
      });
    }

    // ─── Build products list ────────────────────────────────────────────────
    let subtotal = 0;
    let totalMrp = 0;

    const products = cartDoc.items.map((item: any) => {
      const p = item.product_id as any;
      const qty = item.qty || 1;
      const price = item.price || p?.selling_price || 0;
      const mrp = p?.mrp || price;
      const itemSaving = Math.max(0, (mrp - price) * qty);

      subtotal  += price * qty;
      totalMrp  += mrp   * qty;

      return {
        cart_item_id:   item._id,
        product_id:     p?._id || null,
        product_name:   p?.product_name  || 'Unknown',
        product_image:  p?.product_image || null,
        selling_price:  price,
        mrp,
        quantity_unit:  p?.quantity  || '',
        brand:          p?.brand     || null,
        category:       p?.category  || null,
        description:    p?.description || null,
        is_active:      p?.is_active || '1',
        stock:          typeof p?.stock === 'number' ? p.stock : 10,
        bulk_stock:     typeof p?.bulk_stock === 'number' ? p.bulk_stock : undefined,
        is_in_cart:     true,
        cart_count:     qty,
        item_saving:    parseFloat(itemSaving.toFixed(2)),
        subtotal:       parseFloat((price * qty).toFixed(2)),
      };
    });

    const totalSaving    = Math.max(0, totalMrp - subtotal);
    const isFreeDelivery = subtotal >= FREE_DELIVERY_ABOVE;
    const deliveryCharge = isFreeDelivery ? 0 : DELIVERY_CHARGE;
    const payable        = subtotal + deliveryCharge;

    const couponInfo = getCoupons(subtotal);

    // ─── Addresses ──────────────────────────────────────────────────────────
    const defaultAddress = (addresses as any[]).find(a => a.is_default === true || a.is_default === 'true')
      || addresses[0]
      || null;

    return NextResponse.json({
      success: true,
      data: {
        // Cart items
        cart_count:      products.length,
        total_items_qty: cartDoc.items.reduce((s: number, i: any) => s + (i.qty || 1), 0),
        products,

        // Full pricing breakdown (ready for checkout screen)
        pricing: {
          subtotal:          parseFloat(subtotal.toFixed(2)),
          total_mrp:         parseFloat(totalMrp.toFixed(2)),
          total_saving:      parseFloat(totalSaving.toFixed(2)),
          delivery_charge:   deliveryCharge,
          coupon_discount:   0,          // updated after coupon is applied
          wallet_used:       0,          // updated when user opts in wallet
          payable_amount:    parseFloat(payable.toFixed(2)),
          free_delivery_above: FREE_DELIVERY_ABOVE,
          is_free_delivery:  isFreeDelivery,
          free_delivery_message: isFreeDelivery
            ? '🎉 You got free delivery!'
            : `Add ₹${(FREE_DELIVERY_ABOVE - subtotal).toFixed(0)} more for free delivery`,
        },

        // Default address shown at checkout
        default_address: defaultAddress,
        all_addresses:   addresses,
        address_count:   addresses.length,
        applicable:      couponInfo.applicable,

        // Coupons
        coupons: couponInfo,

        // User
        user: user ? {
          name:           (user as any).name,
          mobile_no:      (user as any).mobile_no,
          wallet_balance: (user as any).wallet_balance || 0,
          can_use_wallet: ((user as any).wallet_balance || 0) > 0,
        } : null,

        // Payment methods for checkout
        payment_methods: [
          { id: 'COD',    label: 'Cash on Delivery', is_active: true  },
          { id: 'ONLINE', label: 'Pay Online (UPI / Card)', is_active: true  },
          { id: 'WALLET', label: 'Wallet',
            is_active: ((user as any)?.wallet_balance || 0) > 0,
            balance: (user as any)?.wallet_balance || 0,
          },
        ],
      },
    });
  } catch (e: any) {
    console.error('[Cart API Error]', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const GET  = authMiddleware(getCart);
export const POST = authMiddleware(getCart);
