// Orders API Route - Auto sync payment on delivery
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import Cart from '@/lib/models/Cart';
import '@/lib/models/DeliveryBoy';
import '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
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
    if ((session.user as any).role === 'vendor') {
      const Product = (await import('@/lib/models/Product')).default;
      const vendorProducts = await Product.find({ vendor_id: (session.user as any).id }).select('_id').lean();
      const vendorProductIds = vendorProducts.map((p: any) => p._id);

      const vendorItems = await OrderItem.find({ product_id: { $in: vendorProductIds } }).select('order_id').lean();
      const vendorOrderIds = vendorItems.map((item: any) => item.order_id);

      query._id = { $in: vendorOrderIds };
    } else if ((session.user as any).role !== 'admin') {
      const uId = (session.user as any).id || (session.user as any)._id;
      query.user_id = uId;
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

    // Attach items to each order
    const orderIds = orders.map((o: any) => o._id);
    const allItems = await OrderItem.find({ order_id: { $in: orderIds } }).lean();

    const ordersWithItems = orders.map((order: any) => {
      const matchingItems = allItems.filter(
        (i: any) => i.order_id?.toString() === order._id?.toString()
      );
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
    const session = await getServerSession(authOptions);
    await connectDB();
    const body = await request.json();
    const { items, totalAmount, shippingAddress, delivery_charge } = body;

    if (!items?.length || totalAmount == null || !shippingAddress) {
      return NextResponse.json(
        { success: false, message: `Missing required order fields. items=${items?.length || 0}, totalAmount=${totalAmount}, shippingAddress=${!!shippingAddress}` },
        { status: 400 }
      );
    }

    const userId = session?.user ? ((session.user as any).id || (session.user as any)._id) : null;
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

    try {
      const { emitNewOrderPlaced } = await import('@/lib/socketClient');
      emitNewOrderPlaced({
        _id: order._id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        customerName: shippingAddress?.fullName || session?.user?.name || 'Customer',
        customerPhone: shippingAddress?.phone || '',
        createdAt: order.createdAt
      });
    } catch (e) {
      // Ignore socket emit failure
    }

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
