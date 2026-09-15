import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import NegotiationSession from '@/lib/models/NegotiationSession';
import NegotiationMessage from '@/lib/models/NegotiationMessage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST /api/negotiations/[id]/action
// Body: { action: 'ACCEPT' | 'REJECT', sender_id, sender_role, final_price, final_qty }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { action, sender_id, sender_role, final_price, final_qty } = body;

    const session = await NegotiationSession.findById(id);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    if (action === 'ACCEPT') {
      let agreedRate = Number(final_price);
      if (!agreedRate || isNaN(agreedRate) || agreedRate <= 0) {
        const { getNegotiatedPrice } = await import('@/lib/negotiation-utils');
        const pastMessages = await NegotiationMessage.find({ session_id: id }).sort({ createdAt: 1 }).lean();
        agreedRate = getNegotiatedPrice(session, pastMessages);
      }
      if (!agreedRate || agreedRate <= 0) {
        agreedRate = Number(session.current_counter_price || session.initial_offer_price || 50);
      }

      const agreedQty = Math.max(5, Number(final_qty || session.requested_qty));

      session.status = 'ACCEPTED';
      session.final_agreed_price = agreedRate;
      session.final_agreed_qty = agreedQty;
      session.total_deal_amount = Math.round(agreedRate * agreedQty);
      session.deal_token = 'BULK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      session.deal_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours validity
      session.last_sender_role = sender_role || 'vendor';
      await session.save();

      const effectiveSenderId = sender_id || (sender_role === 'vendor' ? session.vendor_id : session.user_id) || session.vendor_id || session.user_id;

      await NegotiationMessage.create({
        session_id: id,
        sender_id: effectiveSenderId,
        sender_role: sender_role || 'vendor',
        sender_name: sender_role === 'vendor' ? session.vendor_shop_name : session.customer_name,
        message: `🎉 Deal Finalized! Agreed: ${agreedQty} ${session.unit} @ ₹${agreedRate}/${session.unit} (Total ₹${session.total_deal_amount}). Valid for 24 hours.`,
        proposed_price: agreedRate,
        proposed_qty: agreedQty,
        offer_type: 'ACCEPT'
      });

      // Notify customer that the deal has been accepted and is ready for order
      if (session.user_id) {
        try {
          const Notification = (await import('@/lib/models/Notification')).default;
          await Notification.create({
            user_id: session.user_id,
            session_id: session._id,
            title: `🎉 Bulk Deal Approved for ${session.product_name}!`,
            message: `Deal agreed at ₹${agreedRate}/${session.unit} (${agreedQty} ${session.unit}). Total ₹${session.total_deal_amount}. Valid for 24 hours.`,
            type: 'bulk_deal_accepted',
            isRead: false,
            link: '/bulk-products',
          });
        } catch (notifErr) {
          console.error('Failed to notify customer of accepted deal:', notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        data: session,
        message: 'Deal accepted and deal token generated'
      });
    } else if (action === 'REJECT') {
      const effectiveSenderId = sender_id || (sender_role === 'vendor' ? session.vendor_id : session.user_id) || session.vendor_id || session.user_id;

      session.status = 'REJECTED';
      session.last_sender_role = sender_role || 'vendor';
      await session.save();

      await NegotiationMessage.create({
        session_id: id,
        sender_id: effectiveSenderId,
        sender_role: sender_role || 'vendor',
        sender_name: sender_role === 'vendor' ? session.vendor_shop_name : session.customer_name,
        message: `Negotiation was closed/declined.`,
        offer_type: 'REJECT'
      });

      return NextResponse.json({
        success: true,
        data: session,
        message: 'Negotiation declined'
      });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
