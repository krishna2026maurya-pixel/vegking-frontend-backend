import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const item = await Coupon.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ data: item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
