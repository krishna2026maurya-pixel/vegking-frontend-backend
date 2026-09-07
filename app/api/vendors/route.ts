import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/lib/models/Vendor';
import { sendWelcomeEmail } from '@/lib/mail';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    const query = search
      ? { $or: [
          { shop_name: { $regex: search, $options: 'i' } },
          { full_name: { $regex: search, $options: 'i' } },
          { mobile_number: { $regex: search, $options: 'i' } },
          { mobile_no: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]}
      : {};

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .select('full_name email mobile_number mobile_no shop_name shop_category business_type city address state landmark gps_location is_verified is_bestseller wallet_balance created_at createdAt shop_image')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Vendor.countDocuments(query),
    ]);

    const formattedVendors = (vendors || []).map((v: any) => ({
      ...v,
      mobile_number: v.mobile_number || v.mobile_no || '',
      mobile_no: v.mobile_no || v.mobile_number || '',
      created_at: v.createdAt || v.created_at || '',
    }));

    return NextResponse.json(
      { success: true, data: formattedVendors, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const bcrypt = (await import('bcryptjs')).default;

    const rawName = String(body.full_name || body.name || '').trim();
    const rawMobile = String(body.mobile_number || body.phone || body.mobile_no || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const rawPassword = String(body.password || '').trim() || 'Vendor@123';

    if (!rawName) {
      return NextResponse.json({ success: false, error: 'Full name is required' }, { status: 400 });
    }

    if (!rawMobile) {
      return NextResponse.json({ success: false, error: 'Mobile number is required' }, { status: 400 });
    }

    // Auto-assign clean email if none provided
    const email = rawEmail || `vendor_${rawMobile.replace(/\D/g, '') || Date.now()}@vegking.com`;

    // Check if vendor with same email or mobile already exists
    const duplicateQuery: any[] = [{ email }];
    if (rawMobile) {
      duplicateQuery.push({ mobile_number: rawMobile }, { mobile_no: rawMobile });
    }

    const existingVendor = await Vendor.findOne({ $or: duplicateQuery });
    if (existingVendor) {
      const isEmail = existingVendor.email === email;
      return NextResponse.json({
        success: false,
        error: isEmail
          ? `A vendor with email "${email}" already exists`
          : `A vendor with mobile number "${rawMobile}" already exists`
      }, { status: 409 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const now = new Date();
    const vendorData = {
      full_name: rawName,
      email: email,
      mobile_number: rawMobile,
      mobile_no: rawMobile,
      password: hashedPassword,
      shop_name: body.shop_name || body.businessName || `${rawName}'s Shop`,
      shop_category: body.shop_category || '',
      business_type: body.business_type || '',
      services_coverage: body.services_coverage || '',
      shop_image: body.shop_image || body.shopImage || null,
      address: body.address || '',
      city: body.city || (body.address ? body.address.split(',')[0].trim() : '') || body.gps_location || 'Pune',
      state: body.state || '',
      pincode: body.pincode || '',
      country: body.country || 'India',
      landmark: body.landmark || '',
      gps_lat: body.gps_lat || '',
      gps_long: body.gps_long || '',
      gps_location: body.gps_location || body.location || body.city || body.address || '',
      gst_number: body.gst_number || body.gstNumber || '',
      pan_number: body.pan_number || body.panNumber || '',
      licence_number: body.licence_number || body.licenceNumber || '',
      gst_certificate: body.gst_certificate || body.gstCertificate || '',
      pan_card: body.pan_card || body.panCard || '',
      aadhar_front: body.aadhar_front || body.aadharFront || '',
      aadhar_back: body.aadhar_back || body.aadharBack || '',
      is_verified: (body.is_verified === true || body.is_verified === '1' || body.is_verified === 1) ? '1' : '0',
      is_bestseller: (body.is_bestseller === true || body.is_bestseller === '1' || body.is_bestseller === 1) ? '1' : '0',
      wallet_balance: Number(body.wallet_balance || 0),
      handling_charge: Number(body.handling_charge || 0),
      fiberbase_token: body.fiberbase_token || '',
      is_active: '1',
      created_at: now.toISOString(),
      createdAt: now,
    };

    const vendor = await Vendor.create(vendorData);

    // Trigger real-time notification for Admin
    try {
      const { notifyNewVendorRegistration } = await import('@/lib/realtimeNotifications');
      await notifyNewVendorRegistration(vendor);
    } catch (e) {
      console.error('Failed to notify vendor registration:', e);
    }

    // Send welcome email (non-blocking)
    try {
      if (vendor.email && !vendor.welcome_email_sent) {
        await sendWelcomeEmail(vendor.full_name || 'Vendor', vendor.email);
        await Vendor.findByIdAndUpdate(vendor._id, { welcome_email_sent: true });
      }
    } catch (mailError) {
      console.error('Failed to send vendor welcome email:', mailError);
    }

    const result = vendor.toObject ? vendor.toObject() : vendor;
    if (result.password) {
      delete result.password;
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
