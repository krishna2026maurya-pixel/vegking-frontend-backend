import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import Product from '@/lib/models/Product';
import Address from '@/lib/models/Address';
import Cart from '@/lib/models/Cart';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import User from '@/lib/models/User';
import { authMiddleware } from '@/lib/auth';

// Ensure models are registered in Mongoose schema registry before populate calls
const _ensureModels = [Order, OrderItem, Product, Address, Cart, DeliveryBoy, User];


async function getMyOrders(request: NextRequest, reqUserId: string) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || '';
    const vendorIdParam = searchParams.get('vendor_id') || searchParams.get('vendorId') || searchParams.get('email') || '';

    const { getUserFromRequest } = await import('@/lib/auth');
    const userObj = await getUserFromRequest(request);
    const userId = userObj?.id !== '64c123456789012345678901' ? userObj?.id : '';
    const role = userObj?.role || 'vendor';
    const rawVendorId = vendorIdParam || userObj?.vendor_id || (role === 'vendor' ? userId : '');

    const query: any = {};
    if (status) query.orderStatus = status;

    if (rawVendorId) {
      const Vendor = (await import('@/lib/models/Vendor')).default;
      let vendorObj: any = null;
      if (mongoose.Types.ObjectId.isValid(rawVendorId)) {
        vendorObj = await Vendor.findById(rawVendorId).lean();
      }
      if (!vendorObj) {
        vendorObj = await Vendor.findOne({
          $or: [{ email: rawVendorId }, { mobile_number: rawVendorId }]
        }).lean();
      }

      const actualVendorId = vendorObj ? vendorObj._id : (mongoose.Types.ObjectId.isValid(rawVendorId) ? rawVendorId : null);

      if (actualVendorId) {
        const vendorObjId = new mongoose.Types.ObjectId(actualVendorId.toString());
        const vendorProducts = await Product.find({
          $or: [
            { vendor_id: actualVendorId.toString() },
            { vendor_id: vendorObjId }
          ]
        }).select('_id').lean();
        const vendorProductIds = vendorProducts.map((p: any) => p._id);

        const vendorItems = await OrderItem.find({ product_id: { $in: vendorProductIds } }).select('order_id').lean();
        const vendorOrderIds = vendorItems.map((item: any) => item.order_id);

        query.$or = [
          { _id: { $in: vendorOrderIds } },
          { vendor_id: actualVendorId.toString() },
          { vendor_id: vendorObjId }
        ];
      } else {
        query._id = { $in: [] };
      }
    } else if (role === 'user' && userId) {
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
