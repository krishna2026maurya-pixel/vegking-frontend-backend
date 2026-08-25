import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DeliveryBoy from '@/lib/models/DeliveryBoy';

/**
 * Middleware utility to authenticate a Rider via Bearer token.
 * Returns the rider document if valid, otherwise null.
 */
export async function authenticateRider(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    await connectDB();
    
    // Find the delivery boy that has this exact fiberbase_token
    const rider = await DeliveryBoy.findOne({ fiberbase_token: token });
    
    return rider || null;
  } catch (error) {
    console.error('Rider Auth Error:', error);
    return null;
  }
}
