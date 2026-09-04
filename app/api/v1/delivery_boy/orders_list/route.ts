import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import Product from '@/lib/models/Product';
import OrderItem from '@/lib/models/OrderItem';
import User from '@/lib/models/User';
import Address from '@/lib/models/Address';
import mongoose from 'mongoose';

const _ensureModels = [Order, DeliveryBoy, Product, OrderItem, User, Address];

/**
 * GET/POST /api/v1/delivery_boy/orders_list
 * Returns filtered list of assigned & available orders for rider app
 */
async function handleOrdersList(request: NextRequest) {
  try {
    await connectDB();
    
    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {}

    const { searchParams } = new URL(request.url);
    const riderId = body.delivery_boy_id || body.riderId || body.rider_id || searchParams.get('delivery_boy_id') || searchParams.get('rider_id');
    const orderStatusParam = body.order_status || searchParams.get('order_status') || '';

    if (!riderId || !mongoose.Types.ObjectId.isValid(riderId)) {
      return NextResponse.json({
        success: false,
        message: 'Valid delivery_boy_id is required',
        total_orders: 0,
        orders_list: []
      }, { status: 400 });
    }

    const query: any = {};
    if (orderStatusParam === 'new_order_list' || orderStatusParam === '1') {
      query.$or = [
        { delivery_boy_id: riderId, orderStatus: { $in: ['Order Placed', 'Pending', '1'] } },
        { delivery_boy_id: null, orderStatus: { $in: ['Order Placed', 'Pending', '1'] } },
        { delivery_boy_id: { $exists: false }, orderStatus: { $in: ['Order Placed', 'Pending', '1'] } }
      ];
    } else {
      query.delivery_boy_id = riderId;
    }

    let orders = await Order.find(query)
      .sort({ updatedAt: -1 })
      .populate('items')
      .populate('address_id')
      .populate('user_id', 'name full_name mobile_no phone mobile')
      .lean();

    const formattedOrders = orders.map((ord: any) => {
      const userObj = ord.user_id || {};
      const customerName = userObj.full_name || userObj.name || ord.customerName || 'Customer';
      const customerPhone = userObj.mobile_no || userObj.mobile || userObj.phone || ord.customerPhone || '9876543210';
      
      const addrObj = (ord.address_id && typeof ord.address_id === 'object') ? ord.address_id : {};
      const fullAddr = [
        addrObj.address_line,
        addrObj.city,
        addrObj.state,
        addrObj.pincode
      ].filter(Boolean).join(', ');

      const itemsList = Array.isArray(ord.items) ? ord.items.map((item: any) => ({
        product_id: String(item.product_id || item._id || ''),
        product_name: item.product_name || item.name || 'Veggie Item',
        product_image: item.product_image || item.image || '',
        selling_price: String(item.price || item.selling_price || 0),
        quantity: String(item.qty || item.quantity || 1),
        price: String(item.price || 0),
        qty: String(item.qty || item.quantity || 1)
      })) : [];

      let numericStatus = '1';
      const st = String(ord.orderStatus || '').toLowerCase();
      if (st.includes('packing') || st.includes('preparing') || st.includes('accepted')) {
        numericStatus = '2';
      } else if (st.includes('out for delivery') || st.includes('on the way')) {
        numericStatus = '3';
      } else if (st.includes('delivered') || st.includes('completed')) {
        numericStatus = '4';
      } else if (st.includes('cancel')) {
        numericStatus = '5';
      } else {
        numericStatus = '1';
      }

      return {
        order_id: String(ord._id),
        order_number: ord.order_number || String(ord._id),
        status: numericStatus,
        orderStatus: ord.orderStatus || 'Order Placed',
        payment_status: ord.payment_status || 'unpaid',
        payment_method: ord.payment_method || 'COD',
        total_amount: String(ord.total_amount || 0),
        delivery_charge: String(ord.delivery_charge || 50),
        otp: ord.otp || '1234',
        created_at: ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString(),
        vendor_details: [
          {
            vendor_id: '1',
            shop_name: 'Veggie Mart Main Store',
            phone: '9876543210',
            address: 'Central Market, Varanasi',
            gps_lat: '25.3176',
            gps_long: '83.0062'
          }
        ],
        customer_details: {
          name: customerName,
          phone: customerPhone
        },
        shipping_address: {
          id: addrObj._id ? String(addrObj._id) : 1,
          user_id: String(userObj._id || ''),
          address_name: customerName,
          address_mobile_number: customerPhone,
          house_apartment_no: addrObj.address_line || '',
          street: addrObj.address_line || '',
          area: addrObj.city || '',
          city: addrObj.city || 'Varanasi',
          state: addrObj.state || 'UP',
          pin_code: addrObj.pincode || '',
          landmark: '',
          address_type: addrObj.label || 'Home',
          gps_address: fullAddr || 'Customer Address, Varanasi',
          gps_lat: '25.3176',
          gps_long: '83.0062'
        },
        order_items: itemsList
      };
    });

    // Filtering for status tabs if specified
    let filteredOrders = formattedOrders;
    if (orderStatusParam === 'new_order_list' || orderStatusParam === '1') {
      filteredOrders = formattedOrders.filter(o => o.status === '1');
    } else if (orderStatusParam === 'processing_list' || orderStatusParam === '2') {
      filteredOrders = formattedOrders.filter(o => o.status === '1' || o.status === '2');
    } else if (orderStatusParam === 'out_for_delivery' || orderStatusParam === '3') {
      filteredOrders = formattedOrders.filter(o => o.status === '3');
    } else if (orderStatusParam === 'delivered_list' || orderStatusParam === '4') {
      filteredOrders = formattedOrders.filter(o => o.status === '4');
    } else if (orderStatusParam === 'cancelled_list' || orderStatusParam === '5') {
      filteredOrders = formattedOrders.filter(o => o.status === '5');
    }

    return NextResponse.json({
      success: true,
      message: 'Orders retrieved successfully',
      total_orders: filteredOrders.length,
      orders_list: filteredOrders
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = handleOrdersList;
export const POST = handleOrdersList;
