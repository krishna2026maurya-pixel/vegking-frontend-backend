import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import Product from '@/lib/models/Product';
import Address from '@/lib/models/Address';
import Cart from '@/lib/models/Cart';
import { authMiddleware } from '@/lib/auth';

async function getMyOrders(request: NextRequest, userId: string) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || '';
    const vendorId = searchParams.get('vendor_id') || '';

    // Check token for vendor role
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    let role = '';
    let tokenVendorId = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { verifyToken } = await import('@/lib/auth');
      const payload = verifyToken(authHeader.substring(7));
      role = payload?.role || '';
      tokenVendorId = payload?.vendor_id || '';
    }

    const query: any = {};
    if (status) query.orderStatus = status;

    const effectiveVendorId = vendorId || (role === 'vendor' ? (tokenVendorId || userId) : '');

    if (effectiveVendorId) {
      const vendorProducts = await Product.find({
        $or: [
          { vendor_id: effectiveVendorId },
          { vendor_id: effectiveVendorId.toString() },
          ...(mongoose.isValidObjectId(effectiveVendorId) ? [{ vendor_id: new mongoose.Types.ObjectId(effectiveVendorId) }] : [])
        ]
      }).select('_id').lean();
      const vendorProductIds = vendorProducts.map((p: any) => p._id);

      if (vendorProductIds.length > 0) {
        const vendorItems = await OrderItem.find({ product_id: { $in: vendorProductIds } }).select('order_id').lean();
        const vendorOrderIds = vendorItems.map((item: any) => item.order_id);
        query._id = { $in: vendorOrderIds };
      } else {
        // Vendor has no products uploaded -> 0 orders
        query._id = { $in: [] };
      }
    } else if (userId && role !== 'admin') {
      query.user_id = userId;
    }

    const [data, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('items')
        .populate('delivery_boy_id', 'name mobile is_active vehicle_number')
        .populate('user_id', 'name email mobile_no')
        .lean(),
      Order.countDocuments(query),
    ]);
    
    return NextResponse.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

async function placeOrder(request: NextRequest, userId: string) {
  try {
    await connectDB();
    const body = await request.json();
    const { address_id, payment_method, coupon_code, items, delivery_charge, total_amount } = body;
    
    if (!address_id || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Address and items are required.' }, { status: 400 });
    }
    
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    
    // 1. Create the Order first
    const order = new Order({
      order_number:  orderNumber,
      user_id:       userId,
      address_id:    address_id || null,
      total_amount:  total_amount || 0,
      delivery_charge: delivery_charge || 0,
      payment_method:  payment_method || 'COD',
      payment_status:  'pending',
      status:        0,                  // legacy numeric
      orderStatus:   'Order Placed',     // new string status
      statusHistory: [{ status: 'Order Placed', updatedAt: new Date(), updatedBy: null }],
      items:         []
    });
    
    await order.save();
    
    // 2. Create OrderItems and reference them
    const itemIds = [];
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) continue;
      
      const orderItem = await OrderItem.create({
        order_id: order._id,
        product_id: item.product_id,
        product_name: product.product_name,
        qty: Number(item.qty),
        price: Number(item.price || product.selling_price || product.mrp || 0),
        image: product.images?.[0] || ''
      });
      
      itemIds.push(orderItem._id);
      
      // Decrease stock if stock status exists
      if (product.stock_status !== undefined) {
        product.stock_status = Math.max(0, (product.stock_status || 0) - Number(item.qty));
        await product.save();
      }
    }
    
    order.items = itemIds;
    await order.save();
    
    // 3. Clear the User's Cart
    await Cart.findOneAndUpdate({ user_id: userId }, { $set: { items: [] } });
    
    // Return populated order
    const populatedOrder = await Order.findById(order._id).populate('items');
    
    return NextResponse.json({
      success: true,
      message: 'Order placed successfully.',
      data: populatedOrder
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export const GET = authMiddleware(getMyOrders);
export const POST = authMiddleware(placeOrder);
