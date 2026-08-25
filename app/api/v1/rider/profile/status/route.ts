import { NextRequest, NextResponse } from 'next/server';
import { authenticateRider } from '@/lib/riderAuth';
import { emitRiderStatusChanged } from '@/lib/socketClient';

export async function PATCH(request: NextRequest) {
  try {
    const rider = await authenticateRider(request);
    if (!rider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { is_active } = body;

    if (is_active !== undefined) {
      rider.is_active = String(is_active);
      await rider.save();

      // Emit real-time event to socket server
      emitRiderStatusChanged({
        rider_id: rider._id,
        is_active: rider.is_active,
        name: rider.name
      });
    }

    return NextResponse.json({ success: true, is_active: rider.is_active });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
