import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

/**
 * Admin authentication middleware.
 *
 * Accepts one of two authentication methods:
 *   1. Authorization: Bearer <JWT>  — token must have `isAdmin: true` in payload
 *   2. x-admin-token: <ADMIN_SECRET> — env-var-based shared secret (for internal tools)
 *
 * Usage:
 *   export const PATCH = adminAuthMiddleware(myHandler);
 *
 * The wrapped handler receives (request, adminId, params) where adminId is the
 * JWT subject (id) or "admin" for the shared-secret path.
 */
export function adminAuthMiddleware(
  handler: (req: NextRequest, adminId: string, params?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    // ── Path 1: Bearer JWT with isAdmin claim ────────────────────────────
    const authHeader =
      request.headers.get('Authorization') ||
      request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (payload && payload.isAdmin === true) {
        const params = context?.params ? await context.params : {};
        return handler(request, payload.id ?? 'admin', params);
      }
    }

    // ── Path 2: Shared-secret header (for admin dashboard / internal use) ─
    const adminToken = request.headers.get('x-admin-token');
    const adminSecret = process.env.ADMIN_SECRET;

    if (adminSecret && adminToken && adminToken === adminSecret) {
      const params = context?.params ? await context.params : {};
      return handler(request, 'admin', params);
    }

    return NextResponse.json(
      { success: false, error: 'Forbidden. Admin access required.' },
      { status: 403 }
    );
  };
}
