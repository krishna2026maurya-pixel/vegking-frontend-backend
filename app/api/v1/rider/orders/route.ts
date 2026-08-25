import { NextRequest, NextResponse } from 'next/server';
import { authenticateRider } from '@/lib/riderAuth';
import Order from '@/lib/models/Order';

export async function GET(request: NextRequest) {
  try {
    const rider = await authenticateRider(request);
    if (!rider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = { delivery_boy_id: rider._id };
    
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
