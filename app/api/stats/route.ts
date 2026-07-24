import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/lib/models/Vendor';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalVendors, totalProducts, totalOrders, totalUsers, totalDeliveryBoys,
      todayOrders, pendingOrders, revenueResult, latestOrders, last7DaysRevenue,
    ] = await Promise.all([
      Vendor.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      DeliveryBoy.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $in: [0, 1, 2, 3] } }),
      Order.aggregate([{ $match: { status: 4 } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      Order.find().populate('user_id', 'mobile_no name').sort({ createdAt: -1 }).limit(5).lean(),
      Order.aggregate([
        { $match: { status: 4, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total_amount' } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const chartLabels: string[] = [];
    const chartData: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      chartLabels.push(d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }));
      const found = last7DaysRevenue.find((r: any) => r._id === key);
      chartData.push(found ? found.revenue : 0);
    }

    return NextResponse.json({
      success: true,
      stats: { totalRevenue: revenueResult[0]?.total ?? 0, todayOrders, pendingOrders, totalOrders, totalVendors, totalProducts, totalUsers, totalDeliveryBoys },
      latestOrders,
      chart: { labels: chartLabels, data: chartData },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
