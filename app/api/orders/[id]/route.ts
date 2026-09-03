import { NextRequest, NextResponse } from 'next/server';
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
    const order = await Order.findById(id).populate('delivery_boy_id').lean();
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    // Fetch order items separately
    const items = await OrderItem.find({ order_id: id }).lean();
    return NextResponse.json({ success: true, data: { ...order, populatedItems: items } });
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

    // Apply other updates
    const updateData = { ...body };
    delete updateData.otp;
    delete updateData.isAdmin;
    delete updateData.statusHistory;
    Object.assign(order, updateData);

    if (order.orderStatus === 'Delivered') {
      order.payment_status = 'completed';
    }

    await order.save();

    // Trigger step-by-step notifications (DB, Email, and Sockets)
    if (body.orderStatus) {
      await sendOrderStatusNotification(order, body.orderStatus);
    }

    return NextResponse.json({ success: true, data: order });
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
