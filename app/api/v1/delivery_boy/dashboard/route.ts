import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import Product from '@/lib/models/Product';
import OrderItem from '@/lib/models/OrderItem';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

const _ensureModels = [Order, DeliveryBoy, Product, OrderItem, User];

/**
 * POST /api/v1/delivery_boy/dashboard
 * GET /api/v1/delivery_boy/dashboard
 * Returns live assigned orders for the logged-in delivery boy
 */
async function handleDashboard(request: NextRequest) {
  try {
    await connectDB();
    
    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {}

    const { searchParams } = new URL(request.url);
    const riderId = body.delivery_boy_id || body.riderId || body.rider_id || searchParams.get('rider_id') || searchParams.get('delivery_boy_id');

    let rider = null;
    if (riderId && mongoose.Types.ObjectId.isValid(riderId)) {
      rider = await DeliveryBoy.findById(riderId).lean();
    }
    if (!rider) {
      rider = await DeliveryBoy.findOne({ is_active: '1' }).lean();
    }

    // Fetch live orders assigned to this rider
    const query: any = {};
    if (rider?._id) {
      query.delivery_boy_id = rider._id;
    }

    const orders = await Order.find(query)
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('items')
      .populate('user_id', 'name full_name mobile_no phone mobile')
      .lean();

    const formattedOrders = orders.map((ord: any) => {
      const userObj = ord.user_id || {};
      const customerName = userObj.full_name || userObj.name || ord.customerName || 'Customer';
      const customerPhone = userObj.mobile_no || userObj.mobile || userObj.phone || ord.customerPhone || '9876543210';
      
      const itemsList = Array.isArray(ord.items) ? ord.items.map((item: any) => ({
        product_name: item.product_name || item.name || 'Grocery Item',
        qty: String(item.qty || item.quantity || 1),
        price: String(item.price || 0)
      })) : [];

      let numericStatus = '1';
      const st = String(ord.orderStatus || '').toLowerCase();
      if (st.includes('packing') || st.includes('preparing') || st.includes('accepted')) {
        numericStatus = '1'; // Assigned / Pending Accept
      } else if (st.includes('out for delivery') || st.includes('on the way')) {
        numericStatus = '3';
      } else if (st.includes('delivered') || st.includes('completed')) {
        numericStatus = '4';
      } else if (st.includes('cancel')) {
        numericStatus = '5';
      }

      return {
        order_id: String(ord._id),
        order_number: ord.order_number || String(ord._id),
        status: numericStatus,
        orderStatus: ord.orderStatus || 'Packing',
        payment_status: ord.payment_status || 'unpaid',
        payment_method: ord.payment_method || 'COD',
        total_amount: String(ord.total_amount || 0),
        delivery_charge: String(ord.delivery_charge || 0),
        otp: ord.otp || '1234',
        created_at: ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString(),
        vendor_details: [
          {
            shop_name: 'Veggie Mart Vendor Store',
            phone: '9876543210',
            address: 'Central Market, Sector 4'
          }
        ],
        customer_details: {
          name: customerName,
          phone: customerPhone
        },
        shipping_address: {
          address_type: 'Home',
          gps_address: 'Customer Address, Sector 4',
          address_name: customerName,
          mobile_number: customerPhone
        },
        order_items: itemsList
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Dashboard loaded successfully',
      data: {
        delivery_boy_details: rider ? {
          id: rider._id,
          name: rider.name || 'Rider',
          phone: rider.mobile_number || rider.mobile || '',
          active_status: rider.is_active === '1' ? 'online' : 'offline'
        } : {
          name: 'Delivery Rider',
          phone: '',
          active_status: 'online'
        },
        statistics: {
          total_orders: formattedOrders.length,
          total_delivered: formattedOrders.filter(o => o.status === '4').length,
          total_cancelled: formattedOrders.filter(o => o.status === '5').length
        },
        today_orders: formattedOrders,
        order_list: formattedOrders
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = handleDashboard;
export const POST = handleDashboard;
