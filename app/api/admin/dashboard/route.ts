import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/lib/models/Vendor';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/dashboard
 * Live database metrics for the Admin Dashboard:
 * - Total Vendors, Products, Orders, Users, Revenue
 * - Daily Analytics (7-day chart series)
 * - Newly added products, users, vendors, orders
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 7 Days ago for analytics chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Parallel aggregate count queries for maximum performance
    const [
      totalVendors,
      vendorsThisMonth,
      totalProducts,
      productsThisMonth,
      totalOrders,
      ordersThisMonth,
      totalUsers,
      usersThisMonth,
      revenueResult,
      recentOrders,
      recentProducts,
      recentVendors,
      recentUsers,
      dailyAgg
    ] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Product.countDocuments({ is_active: { $ne: '0' } }),
      Product.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: '$total_amount' } } }
      ]),
      // Recent orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('user_id', 'name mobile_no')
        .lean(),
      // Newly added products with real DB stock
      Product.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('product_name selling_price stock bulk_stock product_image category createdAt vendor_shop_name')
        .lean(),
      // Newly added vendors
      Vendor.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('full_name shop_name email is_verified createdAt mobile_no')
        .lean(),
      // Newly registered users
      User.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('name email mobile_no role createdAt')
        .lean(),
      // 7-day daily aggregation
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$total_amount' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Build 7-day timeline series for the chart
    const dailyMap = new Map<string, { orders: number; revenue: number }>();
    (dailyAgg || []).forEach((d: any) => {
      dailyMap.set(d._id, { orders: d.orders || 0, revenue: Math.round(d.revenue || 0) });
    });

    const chartDays: Array<{
      date: string;
      label: string;
      dayOfWeek: string;
      orders: number;
      revenue: number;
    }> = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      const found = dailyMap.get(key) || { orders: 0, revenue: 0 };

      chartDays.push({
        date: key,
        label: `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`,
        dayOfWeek: dayNames[d.getDay()],
        orders: found.orders,
        revenue: found.revenue,
      });
    }

    // Format unified recent activity stream
    const activities: any[] = [];

    (recentOrders || []).forEach((order: any) => {
      const customerName = order.user_id?.name || order.customer_name || 'Customer';
      activities.push({
        id: 'order-' + order._id,
        type: 'order',
        title: `Order #${order.order_number || order._id.toString().slice(-6)}`,
        description: `By ${customerName} • ₹${order.total_amount?.toLocaleString('en-IN')}`,
        status: order.orderStatus || 'Order Placed',
        timestamp: order.createdAt || new Date(),
        amount: order.total_amount
      });
    });

    (recentProducts || []).forEach((prod: any) => {
      activities.push({
        id: 'product-' + prod._id,
        type: 'product',
        title: `Product Added: ${prod.product_name}`,
        description: `₹${prod.selling_price} • ${prod.stock ?? 0} in stock (${prod.category || 'General'})`,
        status: `${prod.stock ?? 0} in stock`,
        timestamp: prod.createdAt || new Date(),
        amount: prod.selling_price
      });
    });

    (recentVendors || []).forEach((vendor: any) => {
      activities.push({
        id: 'vendor-' + vendor._id,
        type: 'vendor',
        title: `New Vendor: ${vendor.shop_name || vendor.full_name}`,
        description: `${vendor.full_name} (${vendor.email || vendor.mobile_no || 'Registered'})`,
        status: vendor.is_verified === '1' ? 'Verified' : 'Pending',
        timestamp: vendor.createdAt || new Date(),
        amount: null
      });
    });

    (recentUsers || []).forEach((u: any) => {
      activities.push({
        id: 'user-' + u._id,
        type: 'user',
        title: `New User: ${u.name || 'Customer'}`,
        description: `${u.mobile_no || u.email || 'Registered account'}`,
        status: u.role || 'customer',
        timestamp: u.createdAt || new Date(),
        amount: null
      });
    });

    // Sort unified activities by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalVendors,
          totalProducts,
          totalOrders,
          totalUsers,
          totalRevenue: Math.round(totalRevenue),
          formattedRevenue: '₹' + Math.round(totalRevenue).toLocaleString('en-IN'),
          trends: {
            vendors: vendorsThisMonth > 0 ? `+${vendorsThisMonth} this month` : `${totalVendors} total`,
            products: productsThisMonth > 0 ? `+${productsThisMonth} this month` : `${totalProducts} total`,
            orders: ordersThisMonth > 0 ? `+${ordersThisMonth} this month` : `${totalOrders} total`,
            users: usersThisMonth > 0 ? `+${usersThisMonth} this month` : `${totalUsers} total`,
            revenue: `₹${Math.round(totalRevenue).toLocaleString('en-IN')} total sales`
          }
        },
        chartData: chartDays,
        recentActivity: activities.slice(0, 10),
        recentProducts: recentProducts || [],
        recentOrders: recentOrders || [],
        recentVendors: recentVendors || [],
        recentUsers: recentUsers || [],
      }
    });
  } catch (error: any) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
