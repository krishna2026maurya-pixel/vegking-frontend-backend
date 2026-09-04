import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/error
 * Graceful fallback route when NextAuth redirects to /api/auth/error.
 * Redirects the user back to /vendor/login with the error parameter.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error') || 'CredentialsSignin';
  const targetUrl = new URL(`/vendor/login?error=${encodeURIComponent(error)}`, request.url);
  return NextResponse.redirect(targetUrl);
}
