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
 * POST /api/v1/delivery_boy/dashboard
 * GET /api/v1/delivery_boy/dashboard
 * Returns live assigned & active orders for the specific logged-in rider
 */
async function handleDashboard(request: NextRequest) {
  try {
    await connectDB();
    
    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {}

    const { searchParams } = new URL(request.url);
    const riderId = body.delivery_boy_id || body.riderId || body.rider_id || body.id || searchParams.get('rider_id') || searchParams.get('delivery_boy_id');

    if (!riderId) {
      return NextResponse.json({
        success: false,
        message: 'delivery_boy_id is required'
      }, { status: 400 });
    }

    let rider = null;
    if (mongoose.Types.ObjectId.isValid(riderId)) {
      rider = await DeliveryBoy.findById(riderId).lean();
    }
    if (!rider) {
      rider = await DeliveryBoy.findOne({
        $or: [
          { mobile_number: riderId },
          { email: riderId }
        ]
      }).lean();
    }

    if (!rider) {
      return NextResponse.json({
        success: false,
        message: 'Delivery boy profile not found'
      }, { status: 404 });
    }

    const objRiderId = (rider._id && mongoose.Types.ObjectId.isValid(rider._id)) ? new mongoose.Types.ObjectId(rider._id) : null;

    // Query orders assigned to THIS specific logged-in rider + new unassigned orders available for pickup
    const riderOrders = await Order.find({
      $or: [
        { delivery_boy_id: rider._id },
        { delivery_boy_id: String(rider._id) },
        ...(objRiderId ? [{ delivery_boy_id: objRiderId }] : []),
        {
          $and: [
            {
              $or: [
                { delivery_boy_id: null },
                { delivery_boy_id: { $exists: false } }
              ]
            },
            {
              $or: [
                { status: { $in: [0, 1, 2] } },
                { orderStatus: { $in: ['Order Placed', 'Order Confirmed', 'Packing', 'Assigned'] } }
              ]
            }
          ]
        }
      ]
    })
      .sort({ updatedAt: -1 })
      .limit(100)
      .populate('items')
      .populate('address_id')
      .populate('user_id', 'name full_name mobile_no phone mobile')
      .lean();

    const calcDelivered = (list: any[]) => list.filter((o: any) => {
      const st = String(o.orderStatus || '').toLowerCase();
      const numSt = Number(o.status);
      return st.includes('delivered') || st.includes('completed') || numSt === 4;
    }).length;

    const calcCancelled = (list: any[]) => list.filter((o: any) => {
      const st = String(o.orderStatus || '').toLowerCase();
      const numSt = Number(o.status);
      return st.includes('cancel') || numSt === 5;
    }).length;

    const totalDelivered = calcDelivered(riderOrders);
    const totalCancelled = calcCancelled(riderOrders);
    const walletBalance = Number(rider.wallet_balance || 0);

    // Active deliveries: assigned orders that are not yet Delivered (4) or Cancelled (5)
    const activeRiderOrders = riderOrders.filter((o: any) => {
      const st = String(o.orderStatus || '').toLowerCase();
      const numSt = Number(o.status);
      const isDelivered = st.includes('delivered') || st.includes('completed') || numSt === 4;
      const isCancelled = st.includes('cancel') || numSt === 5;
      return !isDelivered && !isCancelled;
    });

    const formatOrder = (ord: any) => {
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
      const numSt = Number(ord.status);
      if (numSt === 3 || st.includes('out for delivery') || st.includes('on the way')) {
        numericStatus = '3';
      } else if (numSt === 2 || st.includes('packing') || st.includes('preparing') || st.includes('accepted')) {
        numericStatus = '2';
      } else if (numSt === 4 || st.includes('delivered') || st.includes('completed')) {
        numericStatus = '4';
      } else if (numSt === 5 || st.includes('cancel')) {
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
    };

    const formattedActiveOrders = activeRiderOrders.map(formatOrder);
    const formattedAllOrders = riderOrders.map(formatOrder);

    return NextResponse.json({
      success: true,
      message: 'Dashboard loaded successfully',
      data: {
        delivery_boy_details: {
          id: String(rider._id),
          name: rider.name || 'Delivery Partner',
          phone: rider.mobile_number || (rider as any).mobile || (rider as any).phone || '',
          active_status: rider.is_active === '1' ? 'online' : 'offline',
          is_active: rider.is_active || '1',
          is_verified: rider.is_verified || '1',
          wallet_balance: String(walletBalance)
        },
        statistics: {
          total_orders: riderOrders.length,
          total_delivered: totalDelivered,
          total_cancelled: totalCancelled
        },
        today_orders: formattedActiveOrders,
        order_list: formattedAllOrders
      }
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Error loading dashboard',
      data: {
        delivery_boy_details: {
          id: '',
          name: 'Delivery Partner',
          phone: '',
          active_status: 'online',
          is_active: '1',
          is_verified: '1',
          wallet_balance: '0'
        },
        statistics: {
          total_orders: 0,
          total_delivered: 0,
          total_cancelled: 0
        },
        today_orders: [],
        order_list: []
      }
    }, { status: 500 });
  }
}

export const GET = handleDashboard;
export const POST = handleDashboard;
