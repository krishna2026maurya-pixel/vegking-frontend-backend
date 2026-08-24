import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Subscription from '@/lib/models/Subscription';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ success: false, message: 'Subscription ID is required' }, { status: 400 });
    }

    const updated = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
