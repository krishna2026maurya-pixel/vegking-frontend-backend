import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Banner from '@/lib/models/Banner';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const banners = await Banner.find({ is_active: '1' }).sort({ sort_order: 1 }).lean();
    return NextResponse.json({ success: true, data: banners });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
