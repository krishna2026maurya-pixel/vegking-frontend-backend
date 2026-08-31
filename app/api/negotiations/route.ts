import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import NegotiationSession from '@/lib/models/NegotiationSession';
import NegotiationMessage from '@/lib/models/NegotiationMessage';
import Product from '@/lib/models/Product';
import Vendor from '@/lib/models/Vendor';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/negotiations?user_id=...&vendor_id=...&product_id=...
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const vendorId = searchParams.get('vendor_id');
    const productId = searchParams.get('product_id');
    const status = searchParams.get('status');

    const query: any = {};
    if (userId) query.user_id = userId;
    if (vendorId) query.vendor_id = vendorId;
    if (productId) query.product_id = productId;
    if (status) query.status = status;

    const sessions = await NegotiationSession.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: sessions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/negotiations
// Body: { product_id, user_id, requested_qty, initial_offer_price, customer_name, customer_mobile, note }
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { product_id, user_id, requested_qty, initial_offer_price, customer_name, customer_mobile, note } = body;

    if (!product_id || !user_id) {
      return NextResponse.json({ success: false, error: 'Product and User ID are required' }, { status: 400 });
    }

    const qty = Number(requested_qty);
    if (!qty || qty < 5) {
      return NextResponse.json({ success: false, error: 'Bulk negotiation minimum quantity must be at least 5 kg' }, { status: 400 });
    }

    const offerPrice = Number(initial_offer_price);
    if (!offerPrice || offerPrice <= 0) {
      return NextResponse.json({ success: false, error: 'Valid proposed price is required' }, { status: 400 });
    }

    const product = await Product.findById(product_id).lean() as any;
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    if (!product.vendor_id) {
      return NextResponse.json({ success: false, error: 'This product is not linked to any vendor' }, { status: 400 });
    }

    const vendor = await Vendor.findById(product.vendor_id).lean() as any;
    const vendorShopName = vendor?.shop_name || product.vendor_shop_name || 'Verified Vendor';

    let userObj: any = null;
    if (user_id) {
      try { userObj = await User.findById(user_id).lean(); } catch {}
    }
    const custName = customer_name || userObj?.full_name || userObj?.name || 'Customer';
    const custMobile = customer_mobile || userObj?.mobile_number || userObj?.phone || '';

    // Check if there is already an active session for this user + product
    let session = await NegotiationSession.findOne({
      product_id,
      user_id,
      status: { $in: ['OPEN', 'COUNTERED', 'ACCEPTED'] }
    });

    if (session) {
      // Update existing session
      session.requested_qty = qty;
      session.initial_offer_price = offerPrice;
      session.current_counter_price = offerPrice;
      session.status = 'OPEN';
      session.last_sender_role = 'user';
      await session.save();
    } else {
      // Create new negotiation session
      session = await NegotiationSession.create({
        product_id,
        vendor_id: product.vendor_id,
        user_id,
        product_name: product.product_name || product.name,
        product_image: product.product_image || (Array.isArray(product.images) ? product.images[0] : ''),
        vendor_shop_name: vendorShopName,
        customer_name: custName,
        customer_mobile: custMobile,
        requested_qty: qty,
        unit: product.bulk_unit || 'kg',
        original_price: Number(product.selling_price) || Number(product.total_amt) || 0,
        initial_offer_price: offerPrice,
        current_counter_price: offerPrice,
        status: 'OPEN',
        last_sender_role: 'user',
        deal_token: crypto.randomBytes(8).toString('hex').toUpperCase(),
      });
    }

    // Insert the first message
    await NegotiationMessage.create({
      session_id: session._id,
      sender_id: user_id,
      sender_role: 'user',
      sender_name: custName,
      message: note || `Hi ${vendorShopName}, I want to buy ${qty} ${session.unit} of ${session.product_name} at ₹${offerPrice}/${session.unit}. Please let me know your best offer.`,
      proposed_price: offerPrice,
      proposed_qty: qty,
      offer_type: 'PROPOSAL'
    });

    // Notify vendor about the new bulk purchase connection
    try {
      const Notification = (await import('@/lib/models/Notification')).default;
      await Notification.create({
        vendor_id: product.vendor_id,
        session_id: session._id,
        title: `🌾 New Bulk Purchase Inquiry: ${session.product_name}`,
        message: `${custName} initiated bulk negotiation for ${qty} ${session.unit} at proposed ₹${offerPrice}/${session.unit}.`,
        type: 'bulk_inquiry',
        isRead: false,
        link: `bulk-inquiries`
      });
    } catch (notifErr) {
      console.error('Failed to create vendor notification:', notifErr);
    }

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
