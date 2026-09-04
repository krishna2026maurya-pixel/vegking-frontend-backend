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
    } else if (vendorId) {
      vendor = await Vendor.findOne({
        $or: [{ email: vendorId }, { mobile_number: vendorId }]
      }).lean();
    }

    if (!vendor) {
      const { getUserFromRequest } = await import('@/lib/auth');
      const user = await getUserFromRequest(request);
      if (user?.id && user.id !== '64c123456789012345678901') {
        if (mongoose.Types.ObjectId.isValid(user.id)) {
          vendor = await Vendor.findById(user.id).lean();
        }
        if (!vendor && (user as any).email) {
          vendor = await Vendor.findOne({ email: (user as any).email }).lean();
        }
      }
    }

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    const currentVendorId = vendor._id;
    const vendorObjId = new mongoose.Types.ObjectId(currentVendorId.toString());

    // Count products for this vendor
    const productQuery: any = {
      $or: [
        { vendor_id: currentVendorId.toString() },
        { vendor_id: vendorObjId }
      ]
    };
    const [totalProducts, allProducts] = await Promise.all([
      Product.countDocuments(productQuery),
      Product.find(productQuery).limit(10).lean()
    ]);

    // Find order IDs for this vendor's products
    const vendorProducts = await Product.find(productQuery).select('_id').lean();
    const vendorProductIds = vendorProducts.map((p: any) => p._id);

    const OrderItem = (await import('@/lib/models/OrderItem')).default;
    const vendorItems = await OrderItem.find({ product_id: { $in: vendorProductIds } }).select('order_id').lean();
    const vendorOrderIds = vendorItems.map((item: any) => item.order_id);

    const orderQuery: any = {
      $or: [
        { _id: { $in: vendorOrderIds } },
        { vendor_id: currentVendorId.toString() },
        { vendor_id: vendorObjId }
      ]
    };

    const [totalOrders, pendingOrders, completedOrders, recentOrders] = await Promise.all([
      Order.countDocuments(orderQuery),
      Order.countDocuments({
        ...orderQuery,
        orderStatus: { $in: ['Order Placed', 'Packing', 'Pending', 'Order Confirmed', 'Preparing'] }
      }),
      Order.countDocuments({
        ...orderQuery,
        orderStatus: { $in: ['Delivered', 'Completed'] }
      }),
      Order.find(orderQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('delivery_boy_id', 'name mobile')
        .lean()
    ]);

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
