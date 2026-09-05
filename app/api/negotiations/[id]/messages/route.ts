import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import NegotiationSession from '@/lib/models/NegotiationSession';
import NegotiationMessage from '@/lib/models/NegotiationMessage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST /api/negotiations/[id]/messages
// Body: { sender_id, sender_role, sender_name, message, proposed_price, proposed_qty, offer_type }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { sender_id, sender_role, sender_name, message, proposed_price, proposed_qty, offer_type } = body;

    const session = await NegotiationSession.findById(id);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'REJECTED' || session.status === 'EXPIRED') {
      return NextResponse.json({ success: false, error: `This negotiation is already ${session.status.toLowerCase()}` }, { status: 400 });
    }

    const price = proposed_price ? Number(proposed_price) : null;
    const qty = proposed_qty ? Number(proposed_qty) : null;

    if (qty && qty < 5) {
      return NextResponse.json({ success: false, error: 'Bulk quantity must be at least 5 kg' }, { status: 400 });
    }

    if (qty) {
      const Product = (await import('@/lib/models/Product')).default;
      const prod = await Product.findById(session.product_id).lean() as any;
      const maxStock = Number(prod?.bulk_stock ?? prod?.stock ?? 0);
      if (maxStock > 0 && qty > maxStock) {
        return NextResponse.json({
          success: false,
          error: `You cannot order more than the product stock limit (${maxStock} kg available)`
        }, { status: 400 });
      }
    }

    const msgDoc = await NegotiationMessage.create({
      session_id: id,
      sender_id,
      sender_role: sender_role || 'user',
      sender_name: sender_name || (sender_role === 'vendor' ? session.vendor_shop_name : session.customer_name),
      message: message || (price ? `Proposed price: ₹${price}/${session.unit}` : ''),
      proposed_price: price,
      proposed_qty: qty,
      offer_type: offer_type || (price ? 'COUNTER' : 'CHAT')
    });

    // Update session state
    if (price) {
      session.current_counter_price = price;
      if (qty) session.requested_qty = qty;
      session.status = 'COUNTERED';
    }
    session.last_sender_role = sender_role || 'user';
    await session.save();

    // If message is from user/customer, notify vendor
    if (sender_role === 'user' || sender_role === 'customer') {
      try {
        const Notification = (await import('@/lib/models/Notification')).default;
        await Notification.create({
          vendor_id: session.vendor_id,
          session_id: session._id,
          title: `💬 New Message from ${session.customer_name}`,
          message: message || (price ? `New counter proposal: ₹${price}/${session.unit} for ${session.requested_qty} ${session.unit}` : `Sent you a message regarding ${session.product_name}`),
          type: 'bulk_chat',
          isRead: false,
          link: `bulk-inquiries`
        });
      } catch (notifErr) {
        console.error('Failed to notify vendor of message:', notifErr);
      }
    }

    return NextResponse.json({ success: true, data: msgDoc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
