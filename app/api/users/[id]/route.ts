import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

function isDatabaseUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /MONGODB_URI|ECONNREFUSED|ENOTFOUND|timed out|connection/i.test(message);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ success: true, skipped: true, message: 'Database is not configured yet.' });
    }

    await connectDB();
    const { id } = await params;
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (isDatabaseUnavailableError(e)) {
      return NextResponse.json({ success: true, skipped: true, message: 'Database is not available right now.' });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ data: null, message: 'Database is not configured yet.' }, { status: 503 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const item = await User.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ data: item });
  } catch (e: unknown) {
    if (isDatabaseUnavailableError(e)) {
      return NextResponse.json({ data: null, message: 'Database is not available right now.' }, { status: 503 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
