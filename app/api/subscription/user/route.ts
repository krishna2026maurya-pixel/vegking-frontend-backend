import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Subscription from '@/lib/models/Subscription';
import Product from '@/lib/models/Product';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const userId = await getUserIdFromRequest(request);

    let query: any = {};
    if (userId) {
      query.userId = userId;
    }

    const subscriptions = await Subscription.find(query)
      .populate({
        path: 'productId',
        select: 'product_name selling_price mrp product_image images quantity',
      })
      .sort({ createdAt: -1 });

    // Normalize for frontend
    const mapped = subscriptions.map((sub: any) => {
      const prod = sub.productId || {};
      return {
        _id: sub._id,
        quantity: sub.quantity,
        frequency: sub.frequency,
        deliveryDate: sub.deliveryDate,
        price: sub.price,
        status: sub.status,
        verificationStatus: sub.verificationStatus,
        nextDeliveryDate: sub.nextDeliveryDate,
        createdAt: sub.createdAt,
        productId: {
          _id: prod._id || sub.productId,
          name: prod.product_name || sub.productName,
          price: prod.selling_price || sub.price,
          image: prod.product_image || (Array.isArray(prod.images) ? prod.images[0] : null) || sub.image,
        },
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('Fetch subscriptions error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
