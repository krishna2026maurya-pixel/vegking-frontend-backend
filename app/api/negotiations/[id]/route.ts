import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import NegotiationSession from '@/lib/models/NegotiationSession';
import NegotiationMessage from '@/lib/models/NegotiationMessage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const session = await NegotiationSession.findById(id).lean();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Negotiation session not found' }, { status: 404 });
    }

    const messages = await NegotiationMessage.find({ session_id: id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        session,
        messages
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
