import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order, {
  ORDER_STATUSES,
  VALID_TRANSITIONS,
  STATUS_STR_TO_NUM,
  type OrderStatusType,
} from '@/lib/models/Order';
import { adminAuthMiddleware } from '@/lib/adminAuth';
import mongoose from 'mongoose';

/**
 * PATCH /api/orders/:id/status
 *
 * Admin-only endpoint to advance an order to the next status.
 *
 * Body:
 *   {
 *     "orderStatus": "Packing",
 *     "updatedBy": "<admin_objectid>",          // optional
 *     "estimated_delivery": "2026-07-26"         // optional ISO date string
 *   }
 *
 * Enforces valid state machine transitions. Rejects illegal moves
 * (e.g. Delivered -> Packing) with a 400.
 */
async function updateOrderStatus(
  request: NextRequest,
  adminId: string,
  params: any
) {
  try {
    await connectDB();
    const { id } = params;

    // ── Validate order ID ────────────────────────────────────────────────
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID.' },
        { status: 400 }
      );
    }

    // ── Parse + validate body ────────────────────────────────────────────
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body.' },
        { status: 400 }
      );
    }

    const { orderStatus, updatedBy, estimated_delivery } = body;

    if (!orderStatus) {
      return NextResponse.json(
        { success: false, error: 'orderStatus is required.' },
        { status: 400 }
      );
    }

    if (!ORDER_STATUSES.includes(orderStatus as OrderStatusType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status "${orderStatus}". Allowed: ${ORDER_STATUSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // ── Fetch current order ──────────────────────────────────────────────
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    const currentStatus: OrderStatusType =
      (order.orderStatus as OrderStatusType) ?? 'Order Placed';
    const newStatus = orderStatus as OrderStatusType;

    // ── Enforce transition rules ─────────────────────────────────────────
    if (currentStatus === newStatus) {
      return NextResponse.json(
        {
          success: false,
          error: `Order is already in "${currentStatus}" status.`,
        },
        { status: 400 }
      );
    }

    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition: "${currentStatus}" → "${newStatus}". Allowed next: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`,
        },
        { status: 400 }
      );
    }

    // ── Determine who made the update ────────────────────────────────────
    let updatedByRef: mongoose.Types.ObjectId | null = null;
    if (updatedBy && mongoose.Types.ObjectId.isValid(updatedBy)) {
      updatedByRef = new mongoose.Types.ObjectId(updatedBy);
    } else if (adminId !== 'admin' && mongoose.Types.ObjectId.isValid(adminId)) {
      updatedByRef = new mongoose.Types.ObjectId(adminId);
    }

    // ── Apply the update ─────────────────────────────────────────────────
    order.orderStatus = newStatus;
    order.status = STATUS_STR_TO_NUM[newStatus]; // keep numeric field in sync

    // Append to history
    order.statusHistory.push({
      status:    newStatus,
      updatedAt: new Date(),
      updatedBy: updatedByRef,
    });

    // Optional: set estimated delivery
    if (estimated_delivery) {
      const parsedDate = new Date(estimated_delivery);
      if (!isNaN(parsedDate.getTime())) {
        order.estimated_delivery = parsedDate;
      }
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('items')
      .populate('address_id')
      .lean();

    return NextResponse.json({
      success: true,
      message: `Order status updated to "${newStatus}".`,
      data: updatedOrder,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/:id/status
 * Returns just the current status + history (lightweight, good for polling).
 */
async function getOrderStatus(
  request: NextRequest,
  adminId: string,
  params: any
) {
  try {
    await connectDB();
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID.' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id)
      .select('orderStatus statusHistory estimated_delivery order_number status')
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id:                order._id,
        order_number:       order.order_number,
        orderStatus:        order.orderStatus ?? 'Order Placed',
        statusHistory:      order.statusHistory ?? [],
        estimated_delivery: order.estimated_delivery ?? null,
        availableTransitions:
          VALID_TRANSITIONS[(order.orderStatus as OrderStatusType) ?? 'Order Placed'],
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

export const PATCH = adminAuthMiddleware(updateOrderStatus);
export const GET   = adminAuthMiddleware(getOrderStatus);