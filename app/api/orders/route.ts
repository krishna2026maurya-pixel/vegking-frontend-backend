// Orders API Route - Auto sync payment on delivery
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import Cart from '@/lib/models/Cart';
import { verifyToken } from '@/lib/auth';
import '@/lib/models/DeliveryBoy';
import '@/lib/models/User';

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

// Helper to authenticate either via NextAuth web session or Bearer token for mobile
async function getAuthUser(request: NextRequest) {
  // 1. Check NextAuth session (website)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return session.user as any;
    }
  } catch {
    // NextAuth session lookup failed or not a browser request
  }

  // 2. Check Bearer token in headers (mobile app)
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      return {
        id: payload.id || payload.vendor_id,
        _id: payload.id || payload.vendor_id,
        vendor_id: payload.vendor_id,
        role: payload.role || 'vendor',
        email: payload.email,
      };
    }
  }

  // 3. Check query parameters fallback (?vendor_id=...)
  const { searchParams } = new URL(request.url);
  const vendorIdParam = searchParams.get('vendor_id') || searchParams.get('id');
  if (vendorIdParam) {
    return {
      id: vendorIdParam,
      _id: vendorIdParam,
      vendor_id: vendorIdParam,
      role: 'vendor',
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { order_number: { $regex: search, $options: 'i' } },
        { customer_mobile: { $regex: search, $options: 'i' } },
      ];
    }
    if (status !== '') {
      query.orderStatus = status;
    }

    // Role-based filtering
    const isVendor = user.role === 'vendor' || !!user.vendor_id;
    const vendorId = user.vendor_id || user.id || user._id;

    let vendorProductIdsSet: Set<string> | null = null;

    if (isVendor && vendorId) {
      const Product = (await import('@/lib/models/Product')).default;
      const vendorProducts = await Product.find({
        $or: [
          { vendor_id: vendorId },
          { vendor_id: vendorId.toString() },
          ...(mongoose.isValidObjectId(vendorId) ? [{ vendor_id: new mongoose.Types.ObjectId(vendorId) }] : [])
        ]
      }).select('_id').lean();
      
      const vendorProductIds = vendorProducts.map((p: any) => p._id);
      vendorProductIdsSet = new Set(vendorProductIds.map((id: any) => id.toString()));

      if (vendorProductIds.length > 0) {
        const vendorItems = await OrderItem.find({ product_id: { $in: vendorProductIds } }).select('order_id').lean();
        const vendorOrderIds = vendorItems.map((item: any) => item.order_id);
        // Only return orders that contain this vendor's items (empty if no items ordered yet)
        query._id = { $in: vendorOrderIds };
      } else {
        // Vendor has NO products uploaded, so they have 0 orders!
        query._id = { $in: [] };
      }
    } else if (user.role !== 'admin') {
      const uId = user.id || user._id;
      if (uId) query.user_id = uId;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user_id')
        .populate('delivery_boy_id')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    // Attach items to each order (filtered strictly to this vendor's items if vendor view)
    const orderIds = orders.map((o: any) => o._id);
    const allItems = await OrderItem.find({ order_id: { $in: orderIds } }).lean();

    const ordersWithItems = orders.map((order: any) => {
      let matchingItems = allItems.filter(
        (i: any) => i.order_id?.toString() === order._id?.toString()
      );
      if (vendorProductIdsSet) {
        matchingItems = matchingItems.filter(
          (i: any) => i.product_id && vendorProductIdsSet!.has(i.product_id.toString())
        );
      }
      return {
        ...order,
        populatedItems: matchingItems,
        items: matchingItems,
      };
    });

    return NextResponse.json({
      success: true,
      data: ordersWithItems,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error(`\x1b[31m[API ERROR] GET /api/orders failed:\x1b[0m`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    await connectDB();
    const body = await request.json();
    const { items, totalAmount, shippingAddress, delivery_charge } = body;

    if (!items?.length || totalAmount == null || !shippingAddress) {
      return NextResponse.json(
        { success: false, message: `Missing required order fields. items=${items?.length || 0}, totalAmount=${totalAmount}, shippingAddress=${!!shippingAddress}` },
        { status: 400 }
      );
    }

    const userId = user ? (user.id || user._id) : null;
    const order_number = `ORD-${Date.now()}`;

    // Create the order
    const order = await Order.create({
      order_number,
      user_id: userId,
      total_amount: totalAmount,
      delivery_charge: delivery_charge !== undefined ? Number(delivery_charge) : 0,
      payment_method: 'COD',
      payment_status: 'pending',
      shippingAddress,
    });

    // Create OrderItem documents linked to this order
    const createdItems = await OrderItem.insertMany(
      items.map((item: any) => {
        const rawId = item.productId || item._id;
        return {
          order_id: order._id,
          product_id: mongoose.isValidObjectId(rawId) ? rawId : null,
          product_name: item.name || 'Unknown',
          qty: item.quantity || 1,
          price: item.price || 0,
          image: item.image || '',
          is_bulk_deal: Boolean(item.is_bulk_deal),
          negotiation_id: item.negotiation_id || null,
          deal_token: item.deal_token || null,
        };
      })
    );

    // Link item ids back to the order
    order.items = createdItems.map((i: any) => i._id);
    await order.save();

    // Mark any linked negotiation sessions as ordered
    const negotiationIds = items
      .map((i: any) => i.negotiation_id)
      .filter((id: any) => id && mongoose.isValidObjectId(id));

    if (negotiationIds.length > 0) {
      try {
        const NegotiationSession = (await import('@/lib/models/NegotiationSession')).default;
        await NegotiationSession.updateMany(
          { _id: { $in: negotiationIds } },
          { is_ordered: true, order_id: order._id }
        );
      } catch (negErr) {
        console.error('Failed to link order to negotiation session:', negErr);
      }
    }

    // Clear backend cart for logged-in user so items don't linger
    if (userId) {
      await Cart.findOneAndUpdate({ user_id: userId }, { items: [] });
    }

    return NextResponse.json(
      { success: true, _id: order._id.toString().toUpperCase(), order_number, data: order },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(`\x1b[31m[API ERROR] POST /api/orders failed:\x1b[0m`, error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
