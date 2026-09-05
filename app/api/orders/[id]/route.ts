import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import { sendOrderStatusNotification } from '@/lib/notifications';
import '@/lib/models/DeliveryBoy';
import '@/lib/models/User';

// GET /api/orders/[id] — with populated items
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const order = await Order.findById(id).populate('delivery_boy_id').populate('user_id').lean();
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    // Fetch order items separately with populated delivery boy
    const items = await OrderItem.find({ order_id: id }).populate('delivery_boy_id').lean();

    const custName = (order as any).customer_name || (order as any).shippingAddress?.fullName || (order as any).user_id?.name || 'Customer';
    const custMobile = (order as any).customer_mobile || (order as any).shippingAddress?.phone || (order as any).user_id?.mobile_no || (order as any).user_id?.phone || '';
    const orderDate = (order as any).createdAt || (order as any).created_at;

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        customer_name: custName,
        customer_mobile: custMobile,
        createdAt: orderDate,
        created_at: orderDate,
        populatedItems: items,
        items
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    
    // Fetch the order first to properly track history
    const order = mongoose.Types.ObjectId.isValid(id)
      ? await Order.findById(id)
      : await Order.findOne({ order_number: id });
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    // Enforce OTP check if marking order as Delivered (skip for admin override)
    if (body.orderStatus === 'Delivered' && !body.isAdmin) {
      if (!body.otp) {
        return NextResponse.json({ success: false, error: 'Delivery OTP is required to complete the order.' }, { status: 400 });
      }
      const User = (await import('@/lib/models/User')).default;
      const user = await User.findById(order.user_id);
      const correctOtp = user?.delivery_otp || '1234';
      if (body.otp !== correctOtp) {
        return NextResponse.json({ success: false, error: 'Invalid Delivery OTP.' }, { status: 400 });
      }
    }

    // Track status history if orderStatus is being updated
    if (body.orderStatus && body.orderStatus !== order.orderStatus) {
      const legacyStatusMap: Record<string, number> = {
        'Order Placed': 0,
        'Order Confirmed': 1,
        'Packing': 2,
        'Out for Delivery': 3,
        'Delivered': 4,
        'Cancelled': 5,
      };
      if (legacyStatusMap[body.orderStatus] !== undefined) {
        order.status = legacyStatusMap[body.orderStatus];
      }

      order.statusHistory.push({
        status: body.orderStatus,
        updatedAt: new Date(),
        updatedBy: body.updatedBy || (body.isAdmin ? 'Admin' : 'Admin'), 
      });

      // Automatically mark payment as completed when delivered
      if (body.orderStatus === 'Delivered') {
        order.payment_status = 'completed';
      }
    }

    // Handle item-level rider assignment
    if (body.item_id && body.delivery_boy_id !== undefined) {
      await OrderItem.findByIdAndUpdate(body.item_id, {
        delivery_boy_id: body.delivery_boy_id || null,
        ...(body.item_status ? { item_status: body.item_status } : {})
      });
    }

    if (Array.isArray(body.items)) {
      for (const it of body.items) {
        const itemId = it._id || it.itemId || it.id;
        if (itemId && (it.delivery_boy_id !== undefined || it.item_status !== undefined)) {
          await OrderItem.findByIdAndUpdate(itemId, {
            ...(it.delivery_boy_id !== undefined ? { delivery_boy_id: it.delivery_boy_id || null } : {}),
            ...(it.item_status !== undefined ? { item_status: it.item_status } : {})
          });
        }
      }
    }

    // If order-level delivery_boy_id is assigned, also assign to items that don't have a rider
    if (body.delivery_boy_id !== undefined && !body.item_id) {
      await OrderItem.updateMany(
        { order_id: order._id, $or: [{ delivery_boy_id: null }, { delivery_boy_id: { $exists: false } }] },
        { delivery_boy_id: body.delivery_boy_id || null }
      );
    }

    // Apply other updates
    const updateData = { ...body };
    delete updateData.otp;
    delete updateData.isAdmin;
    delete updateData.statusHistory;
    delete updateData.item_id;
    delete updateData.items;
    Object.assign(order, updateData);

    if (order.orderStatus === 'Delivered') {
      order.payment_status = 'completed';
    }

    await order.save();

    // Trigger step-by-step notifications (DB, Email, and Sockets)
    if (body.orderStatus) {
      await sendOrderStatusNotification(order, body.orderStatus);
    }

    const populatedOrder = await Order.findById(order._id).populate('delivery_boy_id').lean();
    const updatedItems = await OrderItem.find({ order_id: order._id }).populate('delivery_boy_id').lean();

    return NextResponse.json({
      success: true,
      data: { ...populatedOrder, items: updatedItems, populatedItems: updatedItems }
    });
  } catch (error: any) {
    console.error(`\x1b[31m[API ERROR] PATCH /api/orders/${id} failed:\x1b[0m`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    await Order.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`\x1b[31m[API ERROR] DELETE /api/orders/${id} failed:\x1b[0m`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
