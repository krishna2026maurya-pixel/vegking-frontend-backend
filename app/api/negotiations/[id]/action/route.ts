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
      const agreedRate = Number(final_price || session.current_counter_price || session.initial_offer_price);
      const agreedQty = Math.max(5, Number(final_qty || session.requested_qty));

      session.status = 'ACCEPTED';
      session.final_agreed_price = agreedRate;
      session.final_agreed_qty = agreedQty;
      session.total_deal_amount = Math.round(agreedRate * agreedQty);
      session.deal_token = 'BULK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      session.deal_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours validity
      session.last_sender_role = sender_role || 'vendor';
      await session.save();

      await NegotiationMessage.create({
        session_id: id,
        sender_id,
        sender_role: sender_role || 'vendor',
        sender_name: sender_role === 'vendor' ? session.vendor_shop_name : session.customer_name,
        message: `🎉 Deal Finalized! Agreed: ${agreedQty} ${session.unit} @ ₹${agreedRate}/${session.unit} (Total ₹${session.total_deal_amount}). Valid for 24 hours.`,
        proposed_price: agreedRate,
        proposed_qty: agreedQty,
        offer_type: 'ACCEPT'
      });

      return NextResponse.json({
        success: true,
        data: session,
        message: 'Deal accepted and deal token generated'
      });
    } else if (action === 'REJECT') {
      session.status = 'REJECTED';
      session.last_sender_role = sender_role || 'vendor';
      await session.save();

      await NegotiationMessage.create({
        session_id: id,
        sender_id,
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
