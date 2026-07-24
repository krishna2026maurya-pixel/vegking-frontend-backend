import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/lib/models/Category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    const [data, total] = await Promise.all([
      Category.find(query).sort({ sort_order: 1 }).skip((page-1)*limit).limit(limit).lean(),
      Category.countDocuments(query),
    ]);
    return NextResponse.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total/limit) } });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const item = await Category.create(body);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
