export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ addresses: user.addresses || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addressData = await req.json();

    await connectDB();
    const user = await User.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.addresses) {
      user.addresses = [];
    }

    if (addressData.is_default) {
      user.addresses.forEach((addr: any) => {
        addr.is_default = false;
      });
    }

    user.addresses.push(addressData);
    user.markModified('addresses');
    await user.save();

    return NextResponse.json({ addresses: user.addresses });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { _id, ...addressData } = await req.json();

    await connectDB();
    const user = await User.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.addresses) {
      user.addresses = [];
    }

    if (addressData.is_default) {
      user.addresses.forEach((addr: any) => {
        addr.is_default = false;
      });
    }

    const address = user.addresses.id(_id);
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    Object.assign(address, addressData);
    user.markModified('addresses');
    await user.save();

    return NextResponse.json({ addresses: user.addresses });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const addressId = url.searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.addresses) {
      user.addresses = [];
    }

    const address = user.addresses.id(addressId);
    if (address) {
      user.addresses.pull(addressId);
      user.markModified('addresses');
    }
    await user.save();

    return NextResponse.json({ addresses: user.addresses });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
