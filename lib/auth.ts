import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const JWT_SECRET = process.env.JWT_SECRET || 'vegking-secure-secret-key-2026';

export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

export function signToken(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    if (!headerB64 || !payloadB64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        return session.user.id;
      }
    } catch (e) {
      // Ignore NextAuth retrieval errors
    }
    if (process.env.NODE_ENV === 'development') {
      return '64c123456789012345678901'; // Dummy user ID for local development
    }
    return null;
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  return payload ? payload.id : null;
}

export function authMiddleware(handler: (req: NextRequest, userId: string, params?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please login again.' }, { status: 401 });
    }
    // Next.js 15: params is now a Promise
    const params = context?.params ? await context.params : {};
    return handler(request, userId, params);
  };
}
