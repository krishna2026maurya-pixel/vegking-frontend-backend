import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { 
  notifyNewOrder, 
  notifyProductAdded, 
  notifyNewUserRegistration, 
  notifyNewVendorRegistration,
  syncMissingOrderNotifications
} from '@/lib/realtimeNotifications';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/notifications/feed?role=admin | vendor | all&vendor_id=...&since=...
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // Auto-detect and generate notifications for any external orders (e.g. placed on Vercel)
    await syncMissingOrderNotifications();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'all';
    const vendorId = searchParams.get('vendor_id');
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const query: any = {};

    if (role === 'admin') {
      // Admin sees ALL notifications across the platform (all orders, registrations, all products)
      query.isAdmin = true;
    } else if (role === 'vendor') {
      // Vendor must ONLY see notifications for their own shop and their own products
      if (vendorId) {
        const vendorIdObj = mongoose.isValidObjectId(vendorId) ? new mongoose.Types.ObjectId(vendorId) : null;
        const vendorConditions: any[] = [vendorId];
        if (vendorIdObj) {
          vendorConditions.push(vendorIdObj);
        }
        query.vendor_id = { $in: vendorConditions };
        query.isAdmin = false;
      } else {
        // Safe fallback: don't leak any notifications if vendorId is absent
        return NextResponse.json(
          { success: true, data: [], unreadCount: 0, serverTime: new Date().toISOString() },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
        );
      }
    }
    // If role is 'all', matches platform notifications

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        // 3-second buffer to absorb any clock drift between client and server
        const bufferedDate = new Date(sinceDate.getTime() - 3000);
        query.createdAt = { $gt: bufferedDate };
      }
    } else {
      // On initial poll (without 'since'): fetch recent unread notifications so active alerts pop up immediately
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      query.$or = [
        { isRead: false },
        { createdAt: { $gt: twoHoursAgo } }
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const countQuery: any = { isRead: false };
    if (role === 'admin') {
      countQuery.isAdmin = true;
    } else if (role === 'vendor' && vendorId) {
      const vendorIdObj = mongoose.isValidObjectId(vendorId) ? new mongoose.Types.ObjectId(vendorId) : null;
      countQuery.vendor_id = { $in: vendorIdObj ? [vendorId, vendorIdObj] : [vendorId] };
      countQuery.isAdmin = false;
    }

    const unreadCount = await Notification.countDocuments(countQuery);

    return NextResponse.json(
      {
        success: true,
        data: notifications,
        unreadCount,
        serverTime: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/notifications/feed - Trigger test notification for verification
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const { action, role, vendorId } = body;

    // 1. Order notification test with full order details
    if (action === 'test_order') {
      const orderNum = Date.now().toString().slice(-6);
      const testOrder = {
        _id: new mongoose.Types.ObjectId(),
        order_number: `ORD-${orderNum}`,
        customer_name: body.customer_name || 'Rahul Sharma',
        customer_mobile: body.mobile || '9876543210',
        total_amount: body.amount || 640,
        payment_method: body.payment_method || 'Online (UPI)',
        shippingAddress: { city: body.city || 'Pune', phone: body.mobile || '9876543210' }
      };
      await notifyNewOrder(testOrder, [
        { name: 'Fresh Farm Spinach 500g', vendor_id: vendorId || null },
        { name: 'Organic Red Tomatoes 1kg', vendor_id: vendorId || null }
      ]);
      return NextResponse.json({ success: true, message: 'Test order notification generated with full details' });
    }

    // 2. Customer Registration notification test with full details
    if (action === 'test_user') {
      const testUser = {
        _id: new mongoose.Types.ObjectId(),
        name: body.name || 'Pooja Verma',
        mobile_no: body.mobile || '9811223344',
        email: body.email || 'pooja.verma@example.com',
        city: body.city || 'Mumbai',
      };
      await notifyNewUserRegistration(testUser);
      return NextResponse.json({ success: true, message: 'Test user registration notification generated with full details' });
    }

    // 3. Vendor Registration notification test with full details
    if (action === 'test_vendor') {
      const testVendor = {
        _id: new mongoose.Types.ObjectId(),
        shop_name: body.shop_name || 'Evergreen Organic Farm Mart',
        full_name: body.owner_name || 'Vikas Patil',
        mobile_number: body.mobile || '9822334455',
        city: body.city || 'Nashik',
      };
      await notifyNewVendorRegistration(testVendor);
      return NextResponse.json({ success: true, message: 'Test vendor registration notification generated with full details' });
    }

    // 4. Product Added notification test with full details
    if (action === 'test_product') {
      const testProduct = {
        _id: new mongoose.Types.ObjectId(),
        product_name: body.product_name || 'Fresh Strawberries Box (500g)',
        category: body.category || 'Fruits',
        stock: body.stock || 45,
        selling_price: body.price || 120,
        vendor_id: vendorId || null,
        vendor_shop_name: body.shop_name || 'Evergreen Organic Farm Mart',
      };
      await notifyProductAdded(testProduct, role === 'vendor' ? 'Vendor Portal' : 'Admin Panel');
      return NextResponse.json({ success: true, message: 'Test product notification generated with full details' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/notifications/feed - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const { id, mark_all, role, vendor_id } = body;

    if (mark_all) {
      const query: any = {};
      if (role === 'admin') query.isAdmin = true;
      if (role === 'vendor' && vendor_id) {
        const vendorIdObj = mongoose.isValidObjectId(vendor_id) ? new mongoose.Types.ObjectId(vendor_id) : null;
        query.vendor_id = { $in: vendorIdObj ? [vendor_id, vendorIdObj] : [vendor_id] };
        query.isAdmin = false;
      }
      await Notification.updateMany(query, { $set: { isRead: true } });
      return NextResponse.json({ success: true, message: 'Marked all as read' });
    }

    if (id) {
      await Notification.findByIdAndUpdate(id, { $set: { isRead: true } });
      return NextResponse.json({ success: true, message: 'Marked as read' });
    }

    return NextResponse.json({ success: false, error: 'Missing id or mark_all' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
