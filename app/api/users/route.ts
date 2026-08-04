import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

function buildMeta(page: number, limit: number, total: number) {
  return { total, page, limit, totalPages: limit > 0 ? Math.ceil(total / limit) : 0 };
}

function isDatabaseUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /MONGODB_URI|ECONNREFUSED|ENOTFOUND|timed out|connection/i.test(message);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ data: [], meta: buildMeta(page, limit, 0), message: 'Database is not configured yet.' });
    }

    await connectDB();
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { mobile_no: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({ data, meta: buildMeta(page, limit, total) });
  } catch (e: unknown) {
    if (isDatabaseUnavailableError(e)) {
      return NextResponse.json({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 }, message: 'Database is not available right now.' });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ data: null, message: 'Database is not configured yet.' }, { status: 503 });
    }

    await connectDB();
    const body = await request.json();
    const item = await User.create(body);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e: unknown) {
    if (isDatabaseUnavailableError(e)) {
      return NextResponse.json({ data: null, message: 'Database is not available right now.' }, { status: 503 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
