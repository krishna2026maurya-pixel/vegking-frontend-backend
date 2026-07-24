import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    const query = search
      ? { $or: [
          { name: { $regex: search, $options: 'i' } },
          { mobile_number: { $regex: search, $options: 'i' } },
        ]}
      : {};

    const [boys, total] = await Promise.all([
      DeliveryBoy.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      DeliveryBoy.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: boys,
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
    const boy = await DeliveryBoy.create(body);
    return NextResponse.json({ success: true, data: boy }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
