import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import Vendor from '@/lib/models/Vendor';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

const _ensureModels = [Product, Order, Vendor, DeliveryBoy];


/**
 * GET /api/v1/vendor/dashboard
 * Returns live statistical metrics for vendor mobile app
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    let vendorId = searchParams.get('vendor_id') || searchParams.get('id');

    if (!vendorId) {
      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (payload?.vendor_id || payload?.id) {
          vendorId = payload.vendor_id || payload.id;
        }
      }
    }

    let vendor = null;
    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      vendor = await Vendor.findById(vendorId).lean();
    }
    if (!vendor) {
      vendor = await Vendor.findOne({ is_verified: '1' }).sort({ updatedAt: -1 }).lean();
    }

    const currentVendorId = vendor ? vendor._id : null;

    // Count products
    const productQuery: any = { is_active: { $ne: '0' } };
    if (currentVendorId) {
      productQuery.$or = [
        { vendor_id: currentVendorId },
        { vendor_id: currentVendorId.toString() }
      ];
    }
    const [totalProducts, allProducts] = await Promise.all([
      Product.countDocuments(productQuery),
      Product.find(productQuery).limit(10).lean()
    ]);

    // Count orders
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      orderStatus: { $in: ['Order Placed', 'Packing', 'Pending'] }
    });
    const completedOrders = await Order.countDocuments({
      orderStatus: 'Delivered'
    });

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('delivery_boy_id', 'name mobile')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        vendor: vendor ? {
          id: vendor._id,
          full_name: vendor.full_name,
          shop_name: vendor.shop_name,
          email: vendor.email,
          mobile_number: vendor.mobile_number,
          wallet_balance: vendor.wallet_balance || 0
        } : null,
        metrics: {
          total_products: totalProducts,
          total_orders: totalOrders,
          pending_orders: pendingOrders,
          completed_orders: completedOrders,
          total_revenue: vendor?.wallet_balance || 0
        },
        stats: {
          products_count: totalProducts,
          orders_count: totalOrders,
          pending_count: pendingOrders,
          delivered_count: completedOrders
        },
        recent_orders: recentOrders,
        recent_products: allProducts
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
