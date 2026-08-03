import { NextRequest, NextResponse } from 'next/server';
import { authenticateRider } from '@/lib/riderAuth';

export async function PATCH(request: NextRequest) {
  try {
    const rider = await authenticateRider(request);
    if (!rider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { current_lat, current_long } = body;

    if (current_lat !== undefined) rider.current_lat = String(current_lat);
    if (current_long !== undefined) rider.current_long = String(current_long);

    await rider.save();

    return NextResponse.json({ success: true, current_lat: rider.current_lat, current_long: rider.current_long });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
