import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Subcategory from '@/lib/models/Subcategory';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    
    const query: any = { is_active: '1' };
    if (search) {
      query.category_name = { $regex: search, $options: 'i' };
    }
    
    const [data, total] = await Promise.all([
      Subcategory.find(query).skip((page - 1) * limit).limit(limit).lean(),
      Subcategory.countDocuments(query),
    ]);
    
    return NextResponse.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
