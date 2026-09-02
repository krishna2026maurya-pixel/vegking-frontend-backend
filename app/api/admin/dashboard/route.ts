import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/lib/models/Vendor';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

/**
 * GET /api/admin/dashboard
 * Returns real, live database metrics for the Admin Dashboard overview:
 * - Total Vendors (verified & total)
 * - Total Products
 * - Total Orders
 * - Total Revenue
 * - Dynamic trend calculations
 * - Real live recent activity feed (orders & vendor registrations)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel aggregate count queries for maximum performance
    const [
      totalVendors,
      vendorsThisMonth,
      totalProducts,
      productsThisMonth,
      totalOrders,
      ordersThisMonth,
      revenueResult,
      recentOrders,
      recentVendors
    ] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Product.countDocuments({ is_active: { $ne: '0' } }),
      Product.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: '$total_amount' } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('user_id', 'name mobile_no')
        .lean(),
      Vendor.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('full_name shop_name email is_verified createdAt')
        .lean()
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Calculate trends dynamically based on monthly activity
    const vendorTrend = vendorsThisMonth > 0 
      ? `+${vendorsThisMonth} new this month` 
      : `${totalVendors} registered`;
    const productTrend = productsThisMonth > 0 
      ? `+${productsThisMonth} added this month` 
      : `${totalProducts} in stock`;
    const orderTrend = ordersThisMonth > 0 
      ? `+${ordersThisMonth} placed this month` 
      : `${totalOrders} total orders`;
    const revenueTrend = `₹${Math.round(totalRevenue).toLocaleString('en-IN')} lifetime sales`;

    // Format unified recent activity stream
    const activities: any[] = [];

    (recentOrders || []).forEach((order: any) => {
      const customerName = order.user_id?.name || order.customer_name || 'Customer';
      activities.push({
        id: 'order-' + order._id,
        type: 'order',
        title: `Order #${order.order_number || order._id.toString().slice(-6)} placed`,
        description: `By ${customerName} for ₹${order.total_amount?.toLocaleString('en-IN')}`,
        status: order.orderStatus || 'Order Placed',
        timestamp: order.createdAt || new Date(),
        amount: order.total_amount
      });
    });

    (recentVendors || []).forEach((vendor: any) => {
      activities.push({
        id: 'vendor-' + vendor._id,
        type: 'vendor',
        title: `New Vendor: ${vendor.shop_name || vendor.full_name}`,
        description: `${vendor.full_name} (${vendor.email}) registered`,
        status: vendor.is_verified === '1' ? 'Verified' : 'Pending',
        timestamp: vendor.createdAt || new Date(),
        amount: null
      });
    });

    // Sort all activities by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalVendors,
          totalProducts,
          totalOrders,
          totalRevenue: Math.round(totalRevenue),
          formattedRevenue: '₹' + Math.round(totalRevenue).toLocaleString('en-IN'),
          trends: {
            vendors: vendorTrend,
            products: productTrend,
            orders: orderTrend,
            revenue: revenueTrend
          }
        },
        recentActivity: activities.slice(0, 8)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
