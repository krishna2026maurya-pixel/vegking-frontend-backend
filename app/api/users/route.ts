import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const query = search ? { $or: [
      { name: { $regex: search, $options: 'i' } },
      { mobile_no: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]} : {};
    const [data, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    return NextResponse.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total/limit) } });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const item = await User.create(body);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
