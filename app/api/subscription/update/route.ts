import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Subscription from '@/lib/models/Subscription';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { subscriptionId, quantity, frequency, deliveryDate } = body;

    if (!subscriptionId) {
      return NextResponse.json({ success: false, message: 'Subscription ID is required' }, { status: 400 });
    }

    const updated = await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        $set: {
          ...(quantity !== undefined && { quantity: Number(quantity) }),
          ...(frequency && { frequency }),
          ...(deliveryDate && { deliveryDate }),
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
