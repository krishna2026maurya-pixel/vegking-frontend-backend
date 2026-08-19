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
        ]}
      : {};

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .select('full_name email mobile_number shop_name city is_verified is_bestseller wallet_balance created_at shop_image')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Vendor.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: vendors, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const bcrypt = (await import('bcryptjs')).default;

    // Map registration form fields if they come from the frontend registration page
    const vendorData = {
      full_name: body.name || body.full_name || '',
      email: body.email?.trim().toLowerCase(),
      mobile_number: body.phone || body.mobile_number || '',
      password: body.password,
      shop_name: body.businessName || body.shop_name || '',
      shop_image: body.shopImage || body.shop_image || '',
      address: body.address || '',
      gst_number: body.gstNumber || body.gst_number || '',
      pan_number: body.panNumber || body.pan_number || '',
      licence_number: body.licenceNumber || body.licence_number || '',
      gst_certificate: body.gstCertificate || body.gst_certificate || '',
      pan_card: body.panCard || body.pan_card || '',
      aadhar_front: body.aadharFront || body.aadhar_front || '',
      aadhar_back: body.aadharBack || body.aadhar_back || '',
      is_verified: body.is_verified || '0', // Defaults to '0' (needs admin verification)
    };

    if (!vendorData.email || !vendorData.password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ email: vendorData.email });
    if (existingVendor) {
      return NextResponse.json({ success: false, error: 'Vendor with this email already exists' }, { status: 409 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    vendorData.password = await bcrypt.hash(vendorData.password, salt);

    const vendor = await Vendor.create(vendorData);

    // Send welcome email (non-blocking)
    try {
      if (vendor.email && !vendor.welcome_email_sent) {
        await sendWelcomeEmail(vendor.full_name || 'Vendor', vendor.email);
        await Vendor.findByIdAndUpdate(vendor._id, { welcome_email_sent: true });
      }
    } catch (mailError) {
      console.error('Failed to send vendor welcome email:', mailError);
    }
    
    // Return vendor without password
    const result = vendor.toObject ? vendor.toObject() : vendor;
    if (result.password) {
      delete result.password;
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
