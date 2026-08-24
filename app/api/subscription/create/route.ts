import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Subscription from '@/lib/models/Subscription';
import Product from '@/lib/models/Product';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    const { productId, quantity = 1, frequency = 'weekly', deliveryDate = 'Monday', selectedWeight } = body;

    if (!productId) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    const product = await Product.findById(productId);
    const basePrice = product ? (Number(product.selling_price) || Number(product.total_amt) || Number(product.mrp) || 0) : 0;
    const discountMultiplier = frequency === 'weekly' ? 0.9 : 0.85;
    const recurringPrice = Math.round(basePrice * Number(quantity) * discountMultiplier);

    // Calculate next delivery date
    const nextDate = new Date();
    if (frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setDate(nextDate.getDate() + 30);
    }

    const subscription = await Subscription.create({
      userId: userId || null,
      productId,
      productName: product?.product_name || product?.name || '',
      image: product?.product_image || product?.images?.[0] || '',
      size: selectedWeight || product?.quantity || '1 unit',
      selectedWeight: selectedWeight || product?.quantity || '1 unit',
      quantity: Number(quantity) || 1,
      frequency,
      deliveryDate,
      price: recurringPrice,
      chargedAmount: recurringPrice,
      status: 'active',
      verificationStatus: 'verified',
      nextDeliveryDate: nextDate,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to product!',
        subscription,
        chargedAmount: recurringPrice,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
