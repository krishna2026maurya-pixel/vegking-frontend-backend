import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';

/**
 * GET /api/v1/delivery-boys
 * POST /api/v1/delivery-boys
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const vendor_id = searchParams.get('vendor_id') || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile_number: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }
    if (vendor_id) {
      query.vendor_id = vendor_id;
    }

    try {
      await import('@/lib/models/Vendor');
    } catch {
      // ignore
    }

    const [boys, total] = await Promise.all([
      DeliveryBoy.find(query)
        .populate('vendor_id', 'shop_name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DeliveryBoy.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: boys,
      delivery_boys: boys,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const boy = await DeliveryBoy.create({
      name: body.name || body.full_name,
      email: body.email || undefined,
      mobile_number: body.mobile_number || body.mobile || body.phone,
      password: body.password || '123456',
      vehicle_type: body.vehicle_type || body.vehicle || 'Bike',
      vehicle_number: body.vehicle_number || body.vehicle_no || '',
      licence_image: body.licence_image || body.license_image || '',
      vendor_id: body.vendor_id || undefined,
      is_verified: body.is_verified !== undefined ? String(body.is_verified) : '1',
      is_active: body.is_active !== undefined ? String(body.is_active) : '1'
    });

    return NextResponse.json({
      success: true,
      message: 'Delivery boy created successfully',
      data: boy
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
