import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';
import mongoose from 'mongoose';

/**
 * GET, PATCH, DELETE /api/v1/delivery-boys/{id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid delivery boy ID' }, { status: 400 });
    }

    const boy = await DeliveryBoy.findById(id).lean();
    if (!boy) {
      return NextResponse.json({ success: false, error: 'Delivery boy not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: boy });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid delivery boy ID' }, { status: 400 });
    }

    const body = await request.json();
    const boy = await DeliveryBoy.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();

    if (!boy) {
      return NextResponse.json({ success: false, error: 'Delivery boy not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery boy updated successfully',
      data: boy
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid delivery boy ID' }, { status: 400 });
    }

    const boy = await DeliveryBoy.findByIdAndDelete(id);
    if (!boy) {
      return NextResponse.json({ success: false, error: 'Delivery boy not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery boy deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
